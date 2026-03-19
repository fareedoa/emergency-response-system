package com.emergency.tracking_service.service;

import com.emergency.tracking_service.domain.model.Vehicle;
import com.emergency.tracking_service.domain.model.VehicleLocation;
import com.emergency.tracking_service.dto.LocationUpdateRequest;
import com.emergency.tracking_service.dto.VehicleLocationResponse;
import com.emergency.tracking_service.exception.ResourceNotFoundException;
import com.emergency.tracking_service.messaging.RabbitMQConfig;
import com.emergency.tracking_service.messaging.events.VehicleLocationEvent;
import com.emergency.tracking_service.repository.VehicleLocationRepository;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TrackingService {

    private static final Logger log = LoggerFactory.getLogger(TrackingService.class);

    private final VehicleLocationRepository locationRepository;
    private final VehicleRepository vehicleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RabbitTemplate rabbitTemplate;

    public TrackingService(VehicleLocationRepository locationRepository,
                           VehicleRepository vehicleRepository,
                           SimpMessagingTemplate messagingTemplate,
                           RabbitTemplate rabbitTemplate) {
        this.locationRepository = locationRepository;
        this.vehicleRepository = vehicleRepository;
        this.messagingTemplate = messagingTemplate;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public VehicleLocationResponse updateLocation(UUID vehicleId, LocationUpdateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        // Update current location on Vehicle record
        vehicle.setCurrentLat(request.getLatitude());
        vehicle.setCurrentLng(request.getLongitude());
        if (request.getIncidentId() != null) {
            vehicle.setActiveIncidentId(request.getIncidentId());
        }
        vehicleRepository.save(vehicle);

        ZonedDateTime now = ZonedDateTime.now();

        // 1. Create the partition record in vehicle_locations
        VehicleLocation locationRecord = VehicleLocation.builder()
                .vehicleId(vehicleId)
                .incidentId(request.getIncidentId() != null ? request.getIncidentId() : vehicle.getActiveIncidentId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .speedKmh(request.getSpeedKmh())
                .heading(request.getHeading())
                .recordedAt(now)
                .build();

        locationRepository.save(locationRecord);

        VehicleLocationResponse response = toResponse(locationRecord);

        // 2. Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/vehicles/" + vehicleId, response);
        if (locationRecord.getIncidentId() != null) {
            messagingTemplate.convertAndSend("/topic/incidents/" + locationRecord.getIncidentId() + "/tracking", response);
        }

        // 3. Publish to RabbitMQ: vehicle.location.<vehicleId>
        try {
            VehicleLocationEvent event = VehicleLocationEvent.builder()
                    .vehicleId(vehicleId)
                    .registration(vehicle.getRegistration())
                    .incidentId(locationRecord.getIncidentId() != null
                            ? locationRecord.getIncidentId().toString() : null)
                    .latitude(locationRecord.getLatitude())
                    .longitude(locationRecord.getLongitude())
                    .speedKmh(locationRecord.getSpeedKmh())
                    .heading(locationRecord.getHeading())
                    .recordedAt(locationRecord.getRecordedAt())
                    .build();
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.RK_VEHICLE_LOCATION_PREFIX + vehicleId,
                    event);
        } catch (Exception e) {
            log.warn("Failed to publish vehicle.location event for vehicleId={}: {}",
                     vehicleId, e.getMessage());
        }

        return response;
    }

    public List<VehicleLocationResponse> getLocationHistory(UUID vehicleId, String incidentId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        List<VehicleLocation> locations;
        if (incidentId != null && !incidentId.isBlank()) {
            locations = locationRepository.findByVehicleIdAndIncidentIdOrderByRecordedAtDesc(vehicleId, incidentId);
        } else {
            locations = locationRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId);
        }

        return locations.stream()
                .map(loc -> mapToResponse(loc, vehicle))
                .toList();
    }


    @Transactional(readOnly = true)
    public VehicleLocationResponse getLatestLocation(UUID vehicleId) {
        VehicleLocation latest = locationRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("No location history for vehicle: " + vehicleId));
        return toResponse(latest);
    }

    private VehicleLocationResponse mapToResponse(VehicleLocation location, Vehicle vehicle) {
        return VehicleLocationResponse.builder()
                .vehicleId(location.getVehicleId())
                .registration(vehicle.getRegistration())
                .incidentId(location.getIncidentId())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .speedKmh(BigDecimal.valueOf(location.getSpeedKmh()))
                .heading(BigDecimal.valueOf(location.getHeading()))
                .recordedAt(location.getRecordedAt().toOffsetDateTime())
                .build();
    }

    private VehicleLocationResponse toResponse(VehicleLocation loc) {
        return VehicleLocationResponse.builder()
                .vehicleId(loc.getVehicleId())
                .incidentId(loc.getIncidentId())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .speedKmh(BigDecimal.valueOf(loc.getSpeedKmh()))
                .heading(BigDecimal.valueOf(loc.getHeading()))
                .recordedAt(loc.getRecordedAt().toOffsetDateTime())
                .build();
    }
}
