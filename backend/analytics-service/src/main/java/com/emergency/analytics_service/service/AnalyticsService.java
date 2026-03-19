package com.emergency.analytics_service.service;

import com.emergency.analytics_service.dto.*;
import com.emergency.analytics_service.repository.incident.IncidentAnalyticsRepository;
import com.emergency.analytics_service.repository.incident.ResponderAnalyticsRepository;
import com.emergency.analytics_service.repository.tracking.VehicleAnalyticsRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AnalyticsService {

    private final IncidentAnalyticsRepository incidentRepo;
    private final ResponderAnalyticsRepository responderRepo;
    private final VehicleAnalyticsRepository vehicleRepo;

    public AnalyticsService(
            IncidentAnalyticsRepository incidentRepo,
            ResponderAnalyticsRepository responderRepo,
            VehicleAnalyticsRepository vehicleRepo) {
        this.incidentRepo = incidentRepo;
        this.responderRepo = responderRepo;
        this.vehicleRepo = vehicleRepo;
    }

    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public List<ResponseTimeStat> getResponseTimes() {
        List<Object[]> rows = incidentRepo.findResponseTimeStatsByType();
        List<ResponseTimeStat> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(ResponseTimeStat.builder()
                    .serviceType(row[0] != null ? row[0].toString() : "UNKNOWN")
                    .avgSeconds(toDouble(row[1]))
                    .minSeconds(toDouble(row[2]))
                    .maxSeconds(toDouble(row[3]))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public List<IncidentByRegionResult> getIncidentsByRegion() {
        List<Object[]> rows = incidentRepo.findIncidentCountsByRegionAndType();
        List<IncidentByRegionResult> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(IncidentByRegionResult.builder()
                    .latBucket(toDouble(row[0]))
                    .lngBucket(toDouble(row[1]))
                    .incidentType(row[2] != null ? row[2].toString() : "UNKNOWN")
                    .count(toLong(row[3]))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "trackingTransactionManager")
    public List<ResourceUtilizationResult> getResourceUtilization() {
        List<Object[]> rows = vehicleRepo.findDispatchStatsByStation();
        List<ResourceUtilizationResult> result = new ArrayList<>();

        for (Object[] row : rows) {
            long total      = toLong(row[2]);
            long dispatched = toLong(row[3]);
            result.add(ResourceUtilizationResult.builder()
                    .stationId(row[0] != null ? row[0].toString() : "UNKNOWN")
                    .stationType(row[1] != null ? row[1].toString() : "UNKNOWN")
                    .totalVehicles(total)
                    .dispatchedVehicles(dispatched)
                    .idleVehicles(total - dispatched)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "trackingTransactionManager")
    public List<HospitalCapacityResult> getHospitalCapacity() {
        List<Object[]> rows = vehicleRepo.findHospitalVehicleCapacity();
        List<HospitalCapacityResult> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(HospitalCapacityResult.builder()
                    .stationType(row[0] != null ? row[0].toString() : "HOSPITAL")
                    .totalVehicles(toLong(row[1]))
                    .deployedVehicles(toLong(row[2]))
                    .idleVehicles(toLong(row[3]))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public List<IncidentTrendResult> getIncidentTrends() {
        LocalDateTime now = LocalDateTime.now();
        List<IncidentTrendResult> result = new ArrayList<>();

        for (int days : new int[]{7, 30, 90}) {
            LocalDateTime cutoff = now.minusDays(days);
            String period = days + "d";
            List<Object[]> rows = incidentRepo.countByTypeCreatedAfter(cutoff);
            for (Object[] row : rows) {
                result.add(IncidentTrendResult.builder()
                        .period(period)
                        .incidentType(row[0] != null ? row[0].toString() : "UNKNOWN")
                        .count(toLong(row[1]))
                        .build());
            }
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public List<PeakHourResult> getPeakHours() {
        List<Object[]> rows = incidentRepo.findIncidentFrequencyByHourAndDayOfWeek();
        List<PeakHourResult> result = new ArrayList<>();

        for (Object[] row : rows) {
            int hour = toInt(row[0]);
            int dow  = toInt(row[1]);
            result.add(PeakHourResult.builder()
                    .hourOfDay(hour)
                    .dayOfWeek(dow)
                    .dayLabel(PeakHourResult.toDayLabel(dow))
                    .count(toLong(row[2]))
                    .build());
        }
        return result;
    }


    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public List<TopResponderResult> getTopResponders() {
        List<Object[]> rows = responderRepo.findTopDeployedResponders();
        List<TopResponderResult> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(TopResponderResult.builder()
                    .responderName(row[0] != null ? row[0].toString() : "UNKNOWN")
                    .responderType(row[1] != null ? row[1].toString() : "UNKNOWN")
                    .deployCount(toLong(row[2]))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true, transactionManager = "incidentTransactionManager")
    public SummaryDashboardResult getSummaryDashboard() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();

        long todayIncidents  = incidentRepo.countTodayIncidents(startOfDay);
        long openIncidents   = incidentRepo.countOpenIncidents();
        long idleResponders  = responderRepo.countIdleResponders();
        long activeResponders = responderRepo.countActiveResponders();

        // Active vehicles from tracking DB — separate transaction
        long activeVehicles  = getActiveVehicles();

        // Average response time across all types
        List<ResponseTimeStat> rtStats = getResponseTimes();
        double avgResponseTime = rtStats.stream()
                .mapToDouble(ResponseTimeStat::getAvgSeconds)
                .average()
                .orElse(0.0);

        String formattedAvg = ResponseTimeStat.builder()
                .avgSeconds(avgResponseTime)
                .build()
                .getAvgFormatted();

        return SummaryDashboardResult.builder()
                .totalIncidentsToday(todayIncidents)
                .openIncidents(openIncidents)
                .avgResponseTimeSeconds(Math.round(avgResponseTime * 10.0) / 10.0)
                .avgResponseTimeFormatted(formattedAvg)
                .activeUnits(activeVehicles)
                .idleResponders(idleResponders)
                .activeResponders(activeResponders)
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true, transactionManager = "trackingTransactionManager")
    public long getActiveVehicles() {
        return vehicleRepo.countActiveVehicles();
    }

    private static double toDouble(Object val) {
        if (val == null) return 0.0;
        return ((Number) val).doubleValue();
    }

    private static long toLong(Object val) {
        if (val == null) return 0L;
        return ((Number) val).longValue();
    }

    private static int toInt(Object val) {
        if (val == null) return 0;
        return ((Number) val).intValue();
    }
}
