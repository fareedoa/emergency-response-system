package com.emergency.tracking_service.service;

import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.domain.model.Vehicle;
import com.emergency.tracking_service.dto.LocationUpdateRequest;
import com.emergency.tracking_service.dto.VehicleLocationResponse;
import com.emergency.tracking_service.messaging.RabbitMQConfig;
import com.emergency.tracking_service.messaging.events.VehicleStatusEvent;
import com.emergency.tracking_service.repository.StationRepository;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VehicleGpsSimulator {

    private static final Logger log = LoggerFactory.getLogger(VehicleGpsSimulator.class);

    /** ~50 m per 2-second tick ≈ 90 km/h */
    private static final double STEP_SIZE_DEGREES = 0.0005;

    /** How long (ms) a vehicle stays ON_SCENE before returning to station. */
    private static final long SCENE_DWELL_MS = 5_000;

    private final VehicleRepository     vehicleRepository;
    private final StationRepository     stationRepository;
    private final TrackingService       trackingService;
    private final SimpMessagingTemplate messaging;
    private final RabbitTemplate        rabbitTemplate;

    /** vehicleId → time (ms) when the vehicle arrived at the incident scene. */
    private final ConcurrentHashMap<UUID, Long> onSceneSince = new ConcurrentHashMap<>();

    public VehicleGpsSimulator(VehicleRepository vehicleRepository,
                                StationRepository stationRepository,
                                TrackingService trackingService,
                                SimpMessagingTemplate messaging,
                                RabbitTemplate rabbitTemplate) {
        this.vehicleRepository = vehicleRepository;
        this.stationRepository  = stationRepository;
        this.trackingService    = trackingService;
        this.messaging          = messaging;
        this.rabbitTemplate     = rabbitTemplate;
    }

    @Scheduled(fixedRate = 2000)
    public void simulateVehicleMovement() {

        // ── Phase 1: EN_ROUTE → inch toward the incident ──────────────────
        for (Vehicle v : vehicleRepository.findByStatus(VehicleStatus.EN_ROUTE)) {
            if (v.getCurrentLat() == null || v.getDestinationLat() == null) continue;
            boolean arrived = step(v);
            if (arrived) {
                v.setStatus(VehicleStatus.ON_SCENE);
                v.setDestinationLat(null);
                v.setDestinationLng(null);
                vehicleRepository.save(v);
                onSceneSince.put(v.getId(), System.currentTimeMillis());
                broadcastStatus(v);
                publishVehicleStatusEvent(RabbitMQConfig.RK_VEHICLE_ON_SCENE, v);
                log.info("Vehicle {} arrived ON_SCENE.", v.getRegistration());
            }
        }

        // ── Phase 2: after dwell time, transition ON_SCENE → RETURNING ────
        long now = System.currentTimeMillis();
        onSceneSince.entrySet().removeIf(entry -> {
            if (now - entry.getValue() < SCENE_DWELL_MS) return false;
            vehicleRepository.findById(entry.getKey()).ifPresent(v -> {
                if (v.getStatus() != VehicleStatus.ON_SCENE) return;
                stationRepository.findById(v.getStationId()).ifPresentOrElse(
                    station -> {
                        if (station.getLatitude() != null) {
                            v.setStatus(VehicleStatus.RETURNING);
                            v.setDestinationLat(station.getLatitude());
                            v.setDestinationLng(station.getLongitude());
                            log.info("Vehicle {} returning to station.", v.getRegistration());
                        } else {
                            // Station has no coordinates — jump to IDLE immediately
                            publishVehicleStatusEvent(RabbitMQConfig.RK_VEHICLE_RETURNED, v);
                            v.setStatus(VehicleStatus.IDLE);
                            v.setActiveIncidentId(null);
                            log.info("Vehicle {} set IDLE (station has no GPS coords).", v.getRegistration());
                        }
                        vehicleRepository.save(v);
                        broadcastStatus(v);
                    },
                    () -> {
                        // Station row not found — reset so vehicle is not stuck forever
                        publishVehicleStatusEvent(RabbitMQConfig.RK_VEHICLE_RETURNED, v);
                        v.setStatus(VehicleStatus.IDLE);
                        v.setActiveIncidentId(null);
                        v.setDestinationLat(null);
                        v.setDestinationLng(null);
                        vehicleRepository.save(v);
                        broadcastStatus(v);
                        log.warn("Vehicle {} set IDLE — station {} not found in DB.", v.getRegistration(), v.getStationId());
                    }
                );
            });
            return true;
        });

        // ── Phase 3: RETURNING → inch back to the station ─────────────────
        for (Vehicle v : vehicleRepository.findByStatus(VehicleStatus.RETURNING)) {
            if (v.getCurrentLat() == null || v.getDestinationLat() == null) continue;
            boolean arrived = step(v);
            if (arrived) {
                publishVehicleStatusEvent(RabbitMQConfig.RK_VEHICLE_RETURNED, v);
                v.setStatus(VehicleStatus.IDLE);
                v.setActiveIncidentId(null);
                v.setDestinationLat(null);
                v.setDestinationLng(null);
                vehicleRepository.save(v);
                broadcastStatus(v);
                log.info("Vehicle {} back at station — IDLE.", v.getRegistration());
            }
        }
    }

    /**
     * Moves the vehicle one step toward its destination, saves the new position,
     * and broadcasts a WebSocket location update.
     *
     * @return {@code true} if the vehicle reached (or was within one step of) its
     *         destination.
     */
    private boolean step(Vehicle vehicle) {
        double cLat    = vehicle.getCurrentLat();
        double cLng    = vehicle.getCurrentLng();
        double destLat = vehicle.getDestinationLat();
        double destLng = vehicle.getDestinationLng();

        double diffLat = destLat - cLat;
        double diffLng = destLng - cLng;
        double dist    = Math.sqrt(diffLat * diffLat + diffLng * diffLng);

        double newLat, newLng;
        boolean arrived;
        if (dist <= STEP_SIZE_DEGREES) {
            newLat  = destLat;
            newLng  = destLng;
            arrived = true;
        } else {
            newLat  = cLat + (diffLat / dist) * STEP_SIZE_DEGREES;
            newLng  = cLng + (diffLng / dist) * STEP_SIZE_DEGREES;
            arrived = false;
        }

        LocationUpdateRequest req = new LocationUpdateRequest();
        req.setLatitude(newLat);
        req.setLongitude(newLng);
        req.setSpeedKmh(90.0);
        req.setHeading(calculateHeading(cLat, cLng, destLat, destLng));
        req.setIncidentId(vehicle.getActiveIncidentId());

        try {
            trackingService.updateLocation(vehicle.getId(), req);
        } catch (Exception e) {
            log.error("GPS update failed for vehicle {}: {}", vehicle.getId(), e.getMessage());
        }

        // Keep local copy in sync so the caller's save() uses the correct coordinates.
        vehicle.setCurrentLat(newLat);
        vehicle.setCurrentLng(newLng);

        return arrived;
    }

    /**
     * Sends a lightweight WebSocket status-change message so the frontend
     * reflects ON_SCENE / RETURNING / IDLE immediately, without waiting for the
     * 30-second REST poll.
     */
    private void broadcastStatus(Vehicle v) {
        VehicleLocationResponse msg = VehicleLocationResponse.builder()
                .vehicleId(v.getId())
                .registration(v.getRegistration())
                .vehicleType(v.getVehicleType()  != null ? v.getVehicleType().name()  : null)
                .vehicleStatus(v.getStatus()     != null ? v.getStatus().name()       : null)
                .latitude(v.getCurrentLat())
                .longitude(v.getCurrentLng())
                .build();
        messaging.convertAndSend("/topic/location-updates",  msg);
        messaging.convertAndSend("/topic/vehicles/" + v.getId(), msg);
    }

    private void publishVehicleStatusEvent(String routingKey, Vehicle v) {
        try {
            VehicleStatusEvent event = VehicleStatusEvent.builder()
                    .vehicleId(v.getId().toString())
                    .incidentId(v.getActiveIncidentId())
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
            log.info("Published {} for vehicleId={} incidentId={}", routingKey, v.getId(), v.getActiveIncidentId());
        } catch (Exception e) {
            log.error("Failed to publish {} for vehicleId={}: {}", routingKey, v.getId(), e.getMessage());
        }
    }

    private Double calculateHeading(double lat1, double lng1, double lat2, double lng2) {
        double dLng = Math.toRadians(lng2 - lng1);
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);
        double y = Math.sin(dLng) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        return (Math.toDegrees(Math.atan2(y, x)) + 360) % 360;
    }
}
