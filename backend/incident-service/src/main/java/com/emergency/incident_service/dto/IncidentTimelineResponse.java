package com.emergency.incident_service.dto;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IncidentTimelineResponse {
    private IncidentStatus status;
    private String modifiedBy;
    private LocalDateTime modifiedAt;
    private String updateType; // ADD, MOD, DEL
}
