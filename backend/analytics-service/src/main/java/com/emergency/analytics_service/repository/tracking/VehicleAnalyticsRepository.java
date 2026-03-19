package com.emergency.analytics_service.repository.tracking;

import com.emergency.analytics_service.domain.tracking.VehicleRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleAnalyticsRepository extends JpaRepository<VehicleRecord, UUID> {

    @Query(value = """
        SELECT
            station_id,
            station_type,
            COUNT(*)                                          AS total,
            COUNT(*) FILTER (WHERE status <> 'IDLE')         AS dispatched
        FROM vehicles
        GROUP BY station_id, station_type
        ORDER BY station_type, station_id
    """, nativeQuery = true)
    List<Object[]> findDispatchStatsByStation();

    @Query(value = """
        SELECT
            station_type,
            COUNT(*)                                          AS total,
            COUNT(*) FILTER (WHERE status <> 'IDLE')         AS dispatched,
            COUNT(*) FILTER (WHERE status = 'IDLE')          AS idle
        FROM vehicles
        WHERE station_type = 'HOSPITAL'
        GROUP BY station_type
    """, nativeQuery = true)
    List<Object[]> findHospitalVehicleCapacity();

    @Query("SELECT COUNT(v) FROM VehicleRecord v WHERE v.status <> com.emergency.analytics_service.domain.enums.VehicleStatus.IDLE")
    long countActiveVehicles();
}
