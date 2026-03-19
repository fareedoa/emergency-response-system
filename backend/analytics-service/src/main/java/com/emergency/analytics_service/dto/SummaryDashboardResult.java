package com.emergency.analytics_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SummaryDashboardResult {

    private long totalIncidentsToday;
    private long openIncidents;
    private double avgResponseTimeSeconds;
    private String avgResponseTimeFormatted;
    private long activeUnits;
    private long idleResponders;
    private long activeResponders;
}
