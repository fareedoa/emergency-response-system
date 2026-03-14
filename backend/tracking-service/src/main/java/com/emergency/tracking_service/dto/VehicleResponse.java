package com.emergency.tracking_service.dto;

import com.emergency.tracking_service.domain.enums.StationType;
import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.domain.enums.VehicleType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VehicleResponse {
    private UUID id;
    private String registration;
    private VehicleType vehicleType;
    private UUID stationId;
    private StationType stationType;
    private UUID driverUserId;
    private Double currentLat;
    private Double currentLng;
    private VehicleStatus status;
    private String activeIncidentId;
    private LocalDateTime updatedAt;
}
