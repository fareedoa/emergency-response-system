package com.emergency.incident_service.dto;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.enums.Severity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Full incident details returned by the API")
public class IncidentResponse {

    @Schema(description = "Unique incident ID")
    private UUID id;

    @Schema(description = "Name of the reporting citizen")
    private String citizenName;

    @Schema(description = "Category of the emergency")
    private IncidentType incidentType;

    @Schema(description = "Description if incident type is OTHER")
    private String otherIncidentType;

    @Schema(description = "Severity of the incident")
    private Severity severity;

    @Schema(description = "Incident latitude")
    private Double latitude;

    @Schema(description = "Incident longitude")
    private Double longitude;

    @Schema(description = "Additional notes")
    private String notes;

    @Schema(description = "Username or ID who created the report")
    private String createdBy;

    @Schema(description = "UUID of the responder unit assigned to this incident")
    private UUID assignedUnit;

    @Schema(description = "Current incident status")
    private IncidentStatus status;

    @Schema(description = "Timestamp when the incident was reported")
    private LocalDateTime createdAt;
}
