package com.emergency.incident_service.messaging.events;

import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.enums.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncidentCreatedEvent {
    private UUID incidentId;
    private IncidentType incidentType;
    private Severity severity;
    private Double latitude;
    private Double longitude;
    private String createdBy;
    private LocalDateTime createdAt;
}
