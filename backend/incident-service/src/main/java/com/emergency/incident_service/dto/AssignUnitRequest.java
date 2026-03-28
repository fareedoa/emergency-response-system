package com.emergency.incident_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Request body for manually assigning a unit (vehicle or responder) to an incident")
public class AssignUnitRequest {

    @NotNull(message = "Unit ID is required")
    @Schema(description = "UUID of the unit to assign", example = "d1e2f3a4-b5c6-7890-abcd-ef0123456789")
    private UUID unitId;
}
