package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.dto.RegisterVehicleRequest;
import com.emergency.tracking_service.dto.VehicleResponse;
import com.emergency.tracking_service.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vehicles")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Vehicles", description = "Register and query emergency responder vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Register a new vehicle", description = "Registers a new ambulance, police car, or fire truck.")
    public ResponseEntity<VehicleResponse> registerVehicle(@Valid @RequestBody RegisterVehicleRequest request) {
        VehicleResponse response = vehicleService.registerVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Get all vehicles", description = "Retrieves all registered vehicles across all stations.")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Get vehicle by ID", description = "Retrieves details of a specific vehicle.")
    public ResponseEntity<VehicleResponse> getVehicle(@PathVariable UUID id) {
        return ResponseEntity.ok(vehicleService.getVehicle(id));
    }
}
