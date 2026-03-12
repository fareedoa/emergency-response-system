package com.emergency.incident_service.dto;

import com.emergency.incident_service.domain.enums.IncidentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Payload for creating a new emergency incident report")
public class CreateIncidentRequest {

    @NotBlank(message = "Citizen name is required")
    @Schema(description = "Full name of the citizen reporting the incident", example = "Kwame Mensah")
    private String citizenName;

    @NotNull(message = "Incident type is required")
    @Schema(description = "Type of incident (ROBBERY, CRIME, FIRE, MEDICAL_EMERGENCY)", example = "ROBBERY")
    private IncidentType incidentType;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    @Schema(description = "Incident latitude from Google Maps", example = "5.6037")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    @Schema(description = "Incident longitude from Google Maps", example = "-0.1870")
    private Double longitude;

    @Schema(description = "Additional notes about the incident", example = "Suspect seen fleeing on foot")
    private String notes;

    @NotNull(message = "Administrator ID is required")
    @Schema(description = "UUID of the admin creating this report", example = "a7b3c1d2-e4f5-6789-abcd-ef0123456789")
    private UUID createdBy;
}
