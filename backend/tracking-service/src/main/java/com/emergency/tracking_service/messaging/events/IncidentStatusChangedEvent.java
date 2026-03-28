package com.emergency.tracking_service.messaging.events;

import com.emergency.tracking_service.domain.enums.IncidentStatus;
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
public class IncidentStatusChangedEvent {
    private UUID incidentId;
    private IncidentStatus previousStatus;
    private IncidentStatus newStatus;
    private UUID assignedUnit;
    private Double destinationLat;
    private Double destinationLng;
    private LocalDateTime changedAt;
}
