package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.dto.LocationUpdateRequest;
import com.emergency.tracking_service.dto.VehicleLocationResponse;
import com.emergency.tracking_service.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LocationController {

    private final TrackingService trackingService;

    @PutMapping("/vehicles/{vehicleId}/location")
    @PreAuthorize("hasAnyRole('RESPONDER', 'SYSTEM_ADMIN')")
    public ResponseEntity<VehicleLocationResponse> updateLocation(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody LocationUpdateRequest request) {
        VehicleLocationResponse response = trackingService.updateLocation(vehicleId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vehicles/{vehicleId}/location/history")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'RESPONDER')")
    public ResponseEntity<List<VehicleLocationResponse>> getLocationHistory(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) String incidentId) {
        List<VehicleLocationResponse> history = trackingService.getLocationHistory(vehicleId, incidentId);
        return ResponseEntity.ok(history);
    }
}