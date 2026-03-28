package com.emergency.tracking_service.repository;

import com.emergency.tracking_service.domain.enums.StationType;
import com.emergency.tracking_service.domain.model.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StationRepository extends JpaRepository<Station, UUID> {
    List<Station> findByStationType(StationType stationType);
}
