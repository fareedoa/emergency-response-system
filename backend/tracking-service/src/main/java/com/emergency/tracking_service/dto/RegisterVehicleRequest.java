package com.emergency.tracking_service.dto;

import com.emergency.tracking_service.domain.enums.StationType;
import com.emergency.tracking_service.domain.enums.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class RegisterVehicleRequest {

    @NotBlank(message = "Registration number is required")
    private String registration;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotNull(message = "Station ID is required")
    private UUID stationId;

    @NotNull(message = "Station type is required")
    private StationType stationType;

    /** Starting GPS position — optional; vehicle appears on the map immediately after registration. */
    private Double latitude;
    private Double longitude;
}
