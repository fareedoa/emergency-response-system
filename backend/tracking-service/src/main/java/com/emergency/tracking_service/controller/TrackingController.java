package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.dto.LocationUpdateRequest;
import com.emergency.tracking_service.dto.VehicleLocationResponse;
import com.emergency.tracking_service.service.TrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/vehicles/{id}/location")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Tracking", description = "Endpoints for updating and retrieving real-time vehicle locations")
public class TrackingController {

    private final TrackingService trackingService;
    private static final String HAS_ANY_ADMIN_ROLE =
            "hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')";

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PutMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Update vehicle location",
        description = "Called periodically by the mobile app to report new GPS coordinates."
    )
    public ResponseEntity<VehicleLocationResponse> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(trackingService.updateLocation(id, request));
    }

    @GetMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get current vehicle location",
        description = "Fetches the most recently recorded location of a specific vehicle."
    )
    public ResponseEntity<VehicleLocationResponse> getLatestLocation(@PathVariable UUID id) {
        return ResponseEntity.ok(trackingService.getLatestLocation(id));
    }
}
