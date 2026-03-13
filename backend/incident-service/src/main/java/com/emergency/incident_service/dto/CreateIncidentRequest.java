package com.emergency.incident_service.dto;

import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.enums.Severity;
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
    @Schema(description = "Type of incident (ACCIDENT, CRIME, FIRE, MEDICAL_EMERGENCY, OTHER)", example = "ROBBERY")
    private IncidentType incidentType;

    @Schema(description = "Description if incident type is OTHER", example = "Chemical Spill")
    private String otherIncidentType;

    @NotNull(message = "Severity is required")
    @Schema(description = "Severity of the incident", example = "HIGH")
    private Severity severity;

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
}
