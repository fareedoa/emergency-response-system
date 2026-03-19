package com.emergency.analytics_service.repository.incident;

import com.emergency.analytics_service.domain.incident.IncidentRecord;
import com.emergency.analytics_service.domain.enums.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Repository
public interface IncidentAnalyticsRepository extends JpaRepository<IncidentRecord, UUID> {


    @Query(value = """
        SELECT
            incident_type                                           AS incidentType,
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))     AS avgSeconds,
            MIN(EXTRACT(EPOCH FROM (updated_at - created_at)))     AS minSeconds,
            MAX(EXTRACT(EPOCH FROM (updated_at - created_at)))     AS maxSeconds
        FROM incidents
        WHERE status = 'RESOLVED'
          AND created_at IS NOT NULL
          AND updated_at IS NOT NULL
        GROUP BY incident_type
        ORDER BY incident_type
    """, nativeQuery = true)
    List<Object[]> findResponseTimeStatsByType();

    @Query(value = """
        SELECT
            ROUND(latitude::numeric, 1)   AS lat,
            ROUND(longitude::numeric, 1)  AS lng,
            incident_type                 AS incidentType,
            COUNT(*)                      AS cnt
        FROM incidents
        GROUP BY ROUND(latitude::numeric, 1),
                 ROUND(longitude::numeric, 1),
                 incident_type
        ORDER BY cnt DESC
    """, nativeQuery = true)
    List<Object[]> findIncidentCountsByRegionAndType();


    @Query("SELECT COUNT(i) FROM IncidentRecord i WHERE i.createdAt >= :startOfDay")
    long countTodayIncidents(@Param("startOfDay") LocalDateTime startOfDay);

    /** Total open (non-resolved) incidents */
    @Query("SELECT COUNT(i) FROM IncidentRecord i WHERE i.status <> com.emergency.analytics_service.domain.enums.IncidentStatus.RESOLVED")
    long countOpenIncidents();

    @Query("""
        SELECT i.incidentType, COUNT(i)
        FROM IncidentRecord i
        WHERE i.createdAt >= :cutoff
        GROUP BY i.incidentType
        ORDER BY i.incidentType
    """)
    List<Object[]> countByTypeCreatedAfter(@Param("cutoff") LocalDateTime cutoff);

    @Query(value = """
        SELECT
            EXTRACT(HOUR FROM created_at)::int  AS hour_of_day,
            EXTRACT(DOW  FROM created_at)::int  AS day_of_week,
            COUNT(*)                             AS incident_count
        FROM incidents
        WHERE created_at IS NOT NULL
        GROUP BY hour_of_day, day_of_week
        ORDER BY incident_count DESC
    """, nativeQuery = true)
    List<Object[]> findIncidentFrequencyByHourAndDayOfWeek();
}
