package com.emergency.analytics_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncidentByRegionResult {

    private double latBucket;
    private double lngBucket;
    private String incidentType;
    private long count;
}
