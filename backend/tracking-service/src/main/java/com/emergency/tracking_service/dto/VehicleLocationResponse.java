package com.emergency.tracking_service.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class VehicleLocationResponse {
    private UUID vehicleId;
    private String registration;
    private String vehicleType;    // populated on WebSocket broadcasts so frontend can update icons
    private String vehicleStatus;  // populated on WebSocket broadcasts so frontend can update badges
    private String incidentId;
    private Double latitude;
    private Double longitude;
    private BigDecimal speedKmh;
    private BigDecimal heading;
    private OffsetDateTime recordedAt;
}
