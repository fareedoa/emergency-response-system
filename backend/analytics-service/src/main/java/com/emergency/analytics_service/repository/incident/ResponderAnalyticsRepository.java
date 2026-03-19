package com.emergency.analytics_service.repository.incident;

import com.emergency.analytics_service.domain.incident.ResponderRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface ResponderAnalyticsRepository extends JpaRepository<ResponderRecord, UUID> {

    @Query("""
        SELECT r.responderType, COUNT(r)
        FROM ResponderRecord r
        WHERE r.available = false
        GROUP BY r.responderType
        ORDER BY COUNT(r) DESC
    """)
    List<Object[]> countDispatchedByType();

    @Query("""
        SELECT r.responderType, COUNT(r)
        FROM ResponderRecord r
        GROUP BY r.responderType
        ORDER BY r.responderType
    """)
    List<Object[]> countTotalByType();

    @Query("""
        SELECT r.name, r.responderType, COUNT(r)
        FROM ResponderRecord r
        WHERE r.available = false
        GROUP BY r.name, r.responderType
        ORDER BY COUNT(r) DESC
    """)
    List<Object[]> findTopDeployedResponders();

    @Query("SELECT COUNT(r) FROM ResponderRecord r WHERE r.available = true")
    long countIdleResponders();

    @Query("SELECT COUNT(r) FROM ResponderRecord r WHERE r.available = false")
    long countActiveResponders();
}
