package com.emergency.analytics_service.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

/** Received from tracking-service: vehicle.location.* */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VehicleLocationEvent {
    private UUID vehicleId;
    private String registration;
    private String incidentId;
    private Double latitude;
    private Double longitude;
    private Double speedKmh;
    private Double heading;
    private ZonedDateTime recordedAt;
}
