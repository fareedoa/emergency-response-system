package com.emergency.tracking_service.controller;

import com.emergency.tracking_service.domain.enums.StationType;
import com.emergency.tracking_service.dto.CreateStationRequest;
import com.emergency.tracking_service.dto.StationResponse;
import com.emergency.tracking_service.service.StationService;
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
@RequestMapping("/stations")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Stations", description = "Manage facilities like hospitals, police stations, and fire stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

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

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')")
    @Operation(summary = "Create a new station", description = "Creates a station matching the caller's department.")
    public ResponseEntity<StationResponse> createStation(
            @Valid @RequestBody CreateStationRequest request,
            Authentication auth) {
        StationType allowed = allowedStationType(auth);
        if (allowed != null && request.getStationType() != allowed) {
            throw new AccessDeniedException("You may only create " + allowed + " stations.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(stationService.createStation(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN', 'DISPATCHER')")
    @Operation(summary = "Get stations", description = "Returns stations scoped to the caller's department.")
    public ResponseEntity<List<StationResponse>> getAllStations(Authentication auth) {
        return ResponseEntity.ok(stationService.getAllStations(allowedStationType(auth)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN', 'DISPATCHER')")
    @Operation(summary = "Get station by ID", description = "Retrieves a specific station if it belongs to the caller's department.")
    public ResponseEntity<StationResponse> getStation(@PathVariable UUID id, Authentication auth) {
        StationResponse station = stationService.getStation(id);
        StationType allowed = allowedStationType(auth);
        if (allowed != null && station.getStationType() != allowed) {
            throw new AccessDeniedException("Access denied to this station.");
        }
        return ResponseEntity.ok(station);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Delete station", description = "Deletes a station by ID. Requires SYSTEM_ADMIN.")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        stationService.deleteStation(id);
        return ResponseEntity.noContent().build();
    }
}
