package com.emergency.tracking_service.dto;

import com.emergency.tracking_service.domain.enums.StationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateStationRequest {

    @NotBlank(message = "Station name is required")
    private String name;

    @NotNull(message = "Station type is required")
    private StationType stationType;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}
