package com.emergency.analytics_service.messaging;

import com.emergency.analytics_service.messaging.events.IncidentCreatedEvent;
import com.emergency.analytics_service.messaging.events.IncidentStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class IncidentEventListener {

    private static final Logger log = LoggerFactory.getLogger(IncidentEventListener.class);

    // ─── incident.created → q.ams.incident.new ───────────────────────────────

    @RabbitListener(queues = RabbitMQConfig.Q_INCIDENT_NEW)
    public void onIncidentCreated(IncidentCreatedEvent event) {
        log.info("[AMS] incident.created — id={} type={} severity={} lat={} lng={} by={}",
                event.getIncidentId(),
                event.getIncidentType(),
                event.getSeverity(),
                event.getLatitude(),
                event.getLongitude(),
                event.getCreatedBy());
    }

    // ─── incident.dispatched → q.ams.incident.dispatch ───────────────────────

    @RabbitListener(queues = RabbitMQConfig.Q_INCIDENT_DISPATCH)
    public void onIncidentDispatched(IncidentStatusChangedEvent event) {
        log.info("[AMS] incident.dispatched — id={} assignedUnit={} at={}",
                event.getIncidentId(),
                event.getAssignedUnit(),
                event.getChangedAt());
    }

    // ─── incident.status.* → q.ams.incident.status ───────────────────────────

    @RabbitListener(queues = RabbitMQConfig.Q_INCIDENT_STATUS)
    public void onIncidentStatusChanged(IncidentStatusChangedEvent event) {
        log.info("[AMS] incident.status.{} — id={} prev={} new={} at={}",
                event.getNewStatus(),
                event.getIncidentId(),
                event.getPreviousStatus(),
                event.getNewStatus(),
                event.getChangedAt());
    }
}
