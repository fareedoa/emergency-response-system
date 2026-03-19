package com.emergency.incident_service.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HospitalCapacityEvent {
    private String hospitalId;
    private String hospitalName;
    private int totalBeds;
    private int occupiedBeds;
    private int availableAmbulances;
    /** Latitude of the hospital */
    private BigDecimal latitude;
    /** Longitude of the hospital */
    private BigDecimal longitude;
}
