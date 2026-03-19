package com.emergency.analytics_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HospitalCapacityResult {

    private String stationType;
    private long totalVehicles;
    private long deployedVehicles;
    private long idleVehicles;
    public double getDeploymentRatePct() {
        if (totalVehicles == 0) return 0.0;
        return Math.round((deployedVehicles * 100.0 / totalVehicles) * 10.0) / 10.0;
    }
}
