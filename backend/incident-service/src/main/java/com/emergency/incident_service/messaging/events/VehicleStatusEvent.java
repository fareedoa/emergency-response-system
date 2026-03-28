package com.emergency.incident_service.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatusEvent {
    private String vehicleId;
    private String incidentId;
}
