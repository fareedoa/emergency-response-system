package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.dto.CreateStationRequest;
import com.emergency.tracking_service.dto.StationResponse;
import com.emergency.tracking_service.service.StationService;
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
@RequestMapping("/stations")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Stations", description = "Manage facilities like hospitals, police stations, and fire stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Create a new station", description = "Creates a new hospital, police station, or fire station.")
    public ResponseEntity<StationResponse> createStation(@Valid @RequestBody CreateStationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stationService.createStation(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN', 'DISPATCHER')")
    @Operation(summary = "Get all stations", description = "Retrieves all registered stations.")
    public ResponseEntity<List<StationResponse>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN', 'DISPATCHER')")
    @Operation(summary = "Get station by ID", description = "Retrieves details of a specific station.")
    public ResponseEntity<StationResponse> getStation(@PathVariable UUID id) {
        return ResponseEntity.ok(stationService.getStation(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Delete station", description = "Deletes a station by ID.")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        stationService.deleteStation(id);
        return ResponseEntity.noContent().build();
    }
}
