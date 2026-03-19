package com.emergency.analytics_service.controller;

import com.emergency.analytics_service.dto.*;
import com.emergency.analytics_service.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Analytics", description = "Operational insights and statistics aggregated from incidents, dispatch, hospital capacity, and vehicle tracking")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /analytics/response-times
     * Any authenticated user.
     */
    @GetMapping("/response-times")
    @Operation(
        summary = "Average response times",
        description = """
            Returns average, minimum, and maximum response times (in seconds) \
            for RESOLVED incidents, grouped by service/incident type and region.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<List<ResponseTimeStat>> getResponseTimes() {
        return ResponseEntity.ok(analyticsService.getResponseTimes());
    }

    /**
     * GET /analytics/incidents-by-region
     * Any authenticated user.
     */
    @GetMapping("/incidents-by-region")
    @Operation(
        summary = "Incident frequency heat-map by region",
        description = """
            Returns incident counts bucketed into 0.1-degree GPS grid cells, \
            grouped by region and incident type. Suitable for rendering a heat-map overlay.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<List<IncidentByRegionResult>> getIncidentsByRegion() {
        return ResponseEntity.ok(analyticsService.getIncidentsByRegion());
    }

    /**
     * GET /analytics/resource-utilization
     * Any authenticated user.
     */
    @GetMapping("/resource-utilization")
    @Operation(
        summary = "Per-station resource utilization",
        description = """
            Returns per-station vehicle dispatch count, idle count, and utilization percentage. \
            Based on real-time vehicle status from the tracking-service.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<List<ResourceUtilizationResult>> getResourceUtilization() {
        return ResponseEntity.ok(analyticsService.getResourceUtilization());
    }

    /**
     * GET /analytics/hospital-capacity
     * hospital_admin and above.
     */
    @GetMapping("/hospital-capacity")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN', 'SYSTEM_ADMIN')")
    @Operation(
        summary = "Hospital bed occupancy and ambulance deployment rates",
        description = """
            Returns time-series snapshot of hospital vehicle capacity: \
            total, deployed, and idle ambulances for HOSPITAL stations.
            
            Access: HOSPITAL_ADMIN or SYSTEM_ADMIN.
            """
    )
    public ResponseEntity<List<HospitalCapacityResult>> getHospitalCapacity() {
        return ResponseEntity.ok(analyticsService.getHospitalCapacity());
    }

    /**
     * GET /analytics/incident-trends
     * Any authenticated user.
     */
    @GetMapping("/incident-trends")
    @Operation(
        summary = "Rolling incident volume trends",
        description = """
            Returns rolling 7-day, 30-day, and 90-day incident counts grouped by incident type. \
            Useful for identifying long-term trends.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<List<IncidentTrendResult>> getIncidentTrends() {
        return ResponseEntity.ok(analyticsService.getIncidentTrends());
    }

    /**
     * GET /analytics/peak-hours
     * Any authenticated user.
     */
    @GetMapping("/peak-hours")
    @Operation(
        summary = "Peak incident hours",
        description = """
            Returns incident frequency by hour-of-day (0-23) and day-of-week, \
            sorted by highest volume. Use this to optimize staffing schedules.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<List<PeakHourResult>> getPeakHours() {
        return ResponseEntity.ok(analyticsService.getPeakHours());
    }

    /**
     * GET /analytics/top-responders
     * SYSTEM_ADMIN only.
     */
    @GetMapping("/top-responders")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(
        summary = "Top deployed responders",
        description = """
            Returns a ranking of the most-deployed responder units by station and service type.
            
            Access: SYSTEM_ADMIN only.
            """
    )
    public ResponseEntity<List<TopResponderResult>> getTopResponders() {
        return ResponseEntity.ok(analyticsService.getTopResponders());
    }

    /**
     * GET /analytics/summary-dashboard
     * Any authenticated user.
     */
    @GetMapping("/summary-dashboard")
    @Operation(
        summary = "KPI summary dashboard",
        description = """
            Returns an aggregated KPI snapshot including: total incidents today, \
            open incidents, average response time, active units, and responder availability.
            
            Access: Any authenticated user.
            """
    )
    public ResponseEntity<SummaryDashboardResult> getSummaryDashboard() {
        return ResponseEntity.ok(analyticsService.getSummaryDashboard());
    }
}
