package com.emergency.tracking_service.repository;

import com.emergency.tracking_service.domain.enums.VehicleStatus;
import com.emergency.tracking_service.domain.enums.VehicleType;
import com.emergency.tracking_service.domain.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    Optional<Vehicle> findByRegistration(String registration);

    List<Vehicle> findByStationId(UUID stationId);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByStatusAndVehicleTypeIn(VehicleStatus status, List<VehicleType> types);

    List<Vehicle> findByStationIdAndStatus(UUID stationId, VehicleStatus status);
}
