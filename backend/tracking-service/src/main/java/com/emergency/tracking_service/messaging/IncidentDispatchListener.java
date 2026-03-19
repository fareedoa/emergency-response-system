package com.emergency.tracking_service.messaging;

import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.domain.model.Vehicle;
import com.emergency.tracking_service.messaging.events.IncidentStatusChangedEvent;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class IncidentDispatchListener {

    private static final Logger log = LoggerFactory.getLogger(IncidentDispatchListener.class);

    private final VehicleRepository vehicleRepository;

    public IncidentDispatchListener(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.Q_DISPATCH)
    public void handleDispatch(IncidentStatusChangedEvent event) {
        log.info("Received incident.dispatched: incidentId={}, assignedUnit={}",
                event.getIncidentId(), event.getAssignedUnit());

        if (event.getAssignedUnit() == null) {
            log.warn("Dispatch event for incident {} has no assigned unit — skipping", event.getIncidentId());
            return;
        }

        vehicleRepository.findById(event.getAssignedUnit()).ifPresentOrElse(
                vehicle -> {
                    vehicle.setStatus(VehicleStatus.DISPATCHED);
                    vehicle.setActiveIncidentId(event.getIncidentId().toString());
                    vehicleRepository.save(vehicle);
                    log.info("Vehicle {} set to DISPATCHED for incident {}",
                            vehicle.getRegistration(), event.getIncidentId());
                },
                () -> log.warn("Vehicle not found for assignedUnit={}", event.getAssignedUnit())
        );
    }
}
