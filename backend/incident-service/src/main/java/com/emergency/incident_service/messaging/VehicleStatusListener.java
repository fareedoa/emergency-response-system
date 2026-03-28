package com.emergency.incident_service.messaging;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.messaging.events.VehicleStatusEvent;
import com.emergency.incident_service.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class VehicleStatusListener {

    private static final Logger log = LoggerFactory.getLogger(VehicleStatusListener.class);

    private final IncidentRepository incidentRepository;

    public VehicleStatusListener(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    /**
     * Vehicle arrived at the incident scene → set incident IN_PROGRESS.
     */
    @RabbitListener(queues = RabbitMQConfig.Q_VEHICLE_ON_SCENE)
    @Transactional
    public void handleVehicleOnScene(VehicleStatusEvent event) {
        log.info("Received vehicle.on_scene: vehicleId={}, incidentId={}", event.getVehicleId(), event.getIncidentId());
        if (event.getIncidentId() == null) return;
        try {
            UUID incidentId = UUID.fromString(event.getIncidentId());
            incidentRepository.findById(incidentId).ifPresent(incident -> {
                if (incident.getStatus() == IncidentStatus.DISPATCHED) {
                    incident.setStatus(IncidentStatus.IN_PROGRESS);
                    incidentRepository.save(incident);
                    log.info("Incident {} set to IN_PROGRESS (vehicle on scene).", incidentId);
                }
            });
        } catch (IllegalArgumentException e) {
            log.error("Invalid incidentId in vehicle.on_scene event: {}", event.getIncidentId());
        }
    }

    /**
     * Vehicle returned to station → set incident RESOLVED.
     */
    @RabbitListener(queues = RabbitMQConfig.Q_VEHICLE_RETURNED)
    @Transactional
    public void handleVehicleReturned(VehicleStatusEvent event) {
        log.info("Received vehicle.returned: vehicleId={}, incidentId={}", event.getVehicleId(), event.getIncidentId());
        if (event.getIncidentId() == null) return;
        try {
            UUID incidentId = UUID.fromString(event.getIncidentId());
            incidentRepository.findById(incidentId).ifPresent(incident -> {
                if (incident.getStatus() != IncidentStatus.RESOLVED) {
                    incident.setStatus(IncidentStatus.RESOLVED);
                    incidentRepository.save(incident);
                    log.info("Incident {} set to RESOLVED (vehicle returned to station).", incidentId);
                }
            });
        } catch (IllegalArgumentException e) {
            log.error("Invalid incidentId in vehicle.returned event: {}", event.getIncidentId());
        }
    }
}
