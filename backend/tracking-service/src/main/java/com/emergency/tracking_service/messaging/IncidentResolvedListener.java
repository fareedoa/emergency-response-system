package com.emergency.tracking_service.messaging;

import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.messaging.events.IncidentStatusChangedEvent;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class IncidentResolvedListener {

    private static final Logger log = LoggerFactory.getLogger(IncidentResolvedListener.class);

    private final VehicleRepository vehicleRepository;

    public IncidentResolvedListener(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.Q_RESOLVED)
    public void handleResolved(IncidentStatusChangedEvent event) {
        log.info("Received incident.resolved: incidentId={}, assignedUnit={}",
                event.getIncidentId(), event.getAssignedUnit());

        if (event.getAssignedUnit() == null) return;

        vehicleRepository.findById(event.getAssignedUnit()).ifPresentOrElse(
                vehicle -> {
                    vehicle.setStatus(VehicleStatus.IDLE);
                    vehicle.setActiveIncidentId(null);
                    vehicleRepository.save(vehicle);
                    log.info("Vehicle {} reset to IDLE after incident {} resolved",
                            vehicle.getRegistration(), event.getIncidentId());
                },
                () -> log.warn("Vehicle not found for assignedUnit={}", event.getAssignedUnit())
        );
    }
}
