package com.emergency.analytics_service.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Received from incident-service: incident.dispatched / incident.status.* */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncidentStatusChangedEvent {
    private UUID incidentId;
    private String previousStatus;
    private String newStatus;
    private UUID assignedUnit;
    private LocalDateTime changedAt;
}
