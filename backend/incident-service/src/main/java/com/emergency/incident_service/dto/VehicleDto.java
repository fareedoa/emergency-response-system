package com.emergency.incident_service.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class VehicleDto {
    private UUID   id;
    private String vehicleType;
    private String status;
    private Double currentLat;
    private Double currentLng;
}
