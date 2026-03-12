package com.emergency.incident_service.dto;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Request body for updating the status of an incident")
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    @Schema(description = "New status for the incident", example = "IN_PROGRESS")
    private IncidentStatus status;
}
