package com.emergency.tracking_service.service;

import com.emergency.tracking_service.domain.model.Vehicle;
import com.emergency.tracking_service.dto.RegisterVehicleRequest;
import com.emergency.tracking_service.dto.VehicleResponse;
import com.emergency.tracking_service.exception.ResourceNotFoundException;
import com.emergency.tracking_service.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional
    public VehicleResponse registerVehicle(RegisterVehicleRequest request) {
        Vehicle vehicle = Vehicle.builder()
                .registration(request.getRegistration())
                .vehicleType(request.getVehicleType())
                .stationId(request.getStationId())
                .stationType(request.getStationType())
                .build();

        return toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicle(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + id));
        return toResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return VehicleResponse.builder()
                .id(vehicle.getId())
                .registration(vehicle.getRegistration())
                .vehicleType(vehicle.getVehicleType())
                .stationId(vehicle.getStationId())
                .stationType(vehicle.getStationType())
                .driverUserId(vehicle.getDriverUserId())
                .currentLat(vehicle.getCurrentLat())
                .currentLng(vehicle.getCurrentLng())
                .status(vehicle.getStatus())
                .activeIncidentId(vehicle.getActiveIncidentId())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
