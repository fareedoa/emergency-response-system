package com.emergency.tracking_service.repository;

import com.emergency.tracking_service.domain.model.VehicleLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleLocationRepository extends JpaRepository<VehicleLocation, Long> {
    
    List<VehicleLocation> findByVehicleIdOrderByRecordedAtDesc(UUID vehicleId);

    Optional<VehicleLocation> findTopByVehicleIdOrderByRecordedAtDesc(UUID vehicleId);

    List<VehicleLocation> findByVehicleIdAndIncidentIdOrderByRecordedAtDesc(UUID vehicleId, String incidentId);

}
