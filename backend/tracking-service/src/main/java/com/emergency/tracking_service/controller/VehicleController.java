package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.domain.enums.StationType;
import com.emergency.tracking_service.dto.RegisterVehicleRequest;
import com.emergency.tracking_service.dto.VehicleResponse;
import com.emergency.tracking_service.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

    /** Returns the StationType the caller is restricted to, or null for SYSTEM_ADMIN (unrestricted). */
    private StationType allowedStationType(Authentication auth) {
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .orElse("SYSTEM_ADMIN");
        return switch (role) {
            case "HOSPITAL_ADMIN" -> StationType.HOSPITAL;
            case "POLICE_ADMIN"   -> StationType.POLICE_STATION;
            case "FIRE_ADMIN"     -> StationType.FIRE_STATION;
            default               -> null; // SYSTEM_ADMIN — unrestricted
        };
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Register a new vehicle", description = "Registers a vehicle matching the caller's department.")
    public ResponseEntity<VehicleResponse> registerVehicle(
            @Valid @RequestBody RegisterVehicleRequest request,
            Authentication auth) {
        StationType allowed = allowedStationType(auth);
        if (allowed != null && request.getStationType() != allowed) {
            throw new AccessDeniedException("You may only register vehicles for " + allowed + " stations.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.registerVehicle(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Get vehicles", description = "Returns vehicles scoped to the caller's department.")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles(Authentication auth) {
        return ResponseEntity.ok(vehicleService.getAllVehicles(allowedStationType(auth)));
    }

    /**
     * Internal endpoint called by incident-service to find IDLE vehicles for auto-dispatch.
     * No auth required — this is an internal service-to-service call.
     */
    @GetMapping("/available")
    @Operation(summary = "Get available (IDLE) vehicles", description = "Used by incident-service for nearest-vehicle dispatch.")
    public ResponseEntity<List<VehicleResponse>> getAvailableVehicles(
            @RequestParam(required = false) String vehicleTypes) {
        return ResponseEntity.ok(vehicleService.getAvailableVehicles(vehicleTypes));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Get vehicle by ID", description = "Retrieves a vehicle if it belongs to the caller's department.")
    public ResponseEntity<VehicleResponse> getVehicle(@PathVariable UUID id, Authentication auth) {
        VehicleResponse vehicle = vehicleService.getVehicle(id);
        StationType allowed = allowedStationType(auth);
        if (allowed != null && vehicle.getStationType() != allowed) {
            throw new AccessDeniedException("Access denied to this vehicle.");
        }
        return ResponseEntity.ok(vehicle);
    }
}
