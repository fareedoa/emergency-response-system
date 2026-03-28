package com.emergency.tracking_service.messaging;

import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.domain.model.Vehicle;
import com.emergency.tracking_service.dto.VehicleLocationResponse;
import com.emergency.tracking_service.messaging.events.IncidentStatusChangedEvent;
import com.emergency.tracking_service.repository.StationRepository;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class IncidentResolvedListener {

    private static final Logger log = LoggerFactory.getLogger(IncidentResolvedListener.class);

    private final VehicleRepository     vehicleRepository;
    private final StationRepository     stationRepository;
    private final SimpMessagingTemplate messaging;

    public IncidentResolvedListener(VehicleRepository vehicleRepository,
                                     StationRepository stationRepository,
                                     SimpMessagingTemplate messaging) {
        this.vehicleRepository = vehicleRepository;
        this.stationRepository  = stationRepository;
        this.messaging          = messaging;
    }

    @RabbitListener(queues = RabbitMQConfig.Q_RESOLVED)
    public void handleResolved(IncidentStatusChangedEvent event) {
        log.info("Received incident.resolved: incidentId={}, assignedUnit={}",
                event.getIncidentId(), event.getAssignedUnit());

        if (event.getAssignedUnit() == null) return;

        vehicleRepository.findById(event.getAssignedUnit()).ifPresent(vehicle -> {
            VehicleStatus current = vehicle.getStatus();

            // Nothing to do if vehicle is already idle or already heading home
            if (current == VehicleStatus.IDLE || current == VehicleStatus.RETURNING) return;

            // Try to send it home via RETURNING; fall back to immediate IDLE
            stationRepository.findById(vehicle.getStationId()).ifPresentOrElse(
                station -> {
                    if (station.getLatitude() != null) {
                        vehicle.setStatus(VehicleStatus.RETURNING);
                        vehicle.setDestinationLat(station.getLatitude());
                        vehicle.setDestinationLng(station.getLongitude());
                        log.info("Vehicle {} set RETURNING after incident {} resolved.",
                                vehicle.getRegistration(), event.getIncidentId());
                    } else {
                        resetToIdle(vehicle);
                    }
                },
                () -> resetToIdle(vehicle)
            );

            vehicleRepository.save(vehicle);
            broadcastStatus(vehicle);
        });
    }

    private void resetToIdle(Vehicle vehicle) {
        vehicle.setStatus(VehicleStatus.IDLE);
        vehicle.setActiveIncidentId(null);
        vehicle.setDestinationLat(null);
        vehicle.setDestinationLng(null);
        log.info("Vehicle {} immediately reset to IDLE (no station).", vehicle.getRegistration());
    }

    private void broadcastStatus(Vehicle v) {
        VehicleLocationResponse msg = VehicleLocationResponse.builder()
                .vehicleId(v.getId())
                .registration(v.getRegistration())
                .vehicleType(v.getVehicleType()  != null ? v.getVehicleType().name()  : null)
                .vehicleStatus(v.getStatus()     != null ? v.getStatus().name()       : null)
                .latitude(v.getCurrentLat())
                .longitude(v.getCurrentLng())
                .build();
        messaging.convertAndSend("/topic/location-updates",      msg);
        messaging.convertAndSend("/topic/vehicles/" + v.getId(), msg);
    }
}
