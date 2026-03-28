package com.emergency.incident_service.repository;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    List<Incident> findByStatusNot(IncidentStatus status);
    List<Incident> findByIncidentTypeIn(Collection<IncidentType> types);
    List<Incident> findByStatusNotAndIncidentTypeIn(IncidentStatus status, Collection<IncidentType> types);
}
