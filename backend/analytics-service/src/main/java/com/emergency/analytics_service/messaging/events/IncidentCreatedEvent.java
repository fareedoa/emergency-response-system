package com.emergency.analytics_service.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Received from incident-service: incident.created */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncidentCreatedEvent {
    private UUID incidentId;
    private String incidentType;
    private String severity;
    private Double latitude;
    private Double longitude;
    private String createdBy;
    private LocalDateTime createdAt;
}
