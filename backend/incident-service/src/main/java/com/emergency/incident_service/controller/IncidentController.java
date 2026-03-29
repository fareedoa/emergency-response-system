package com.emergency.incident_service.controller;

import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.dto.AssignUnitRequest;
import com.emergency.incident_service.dto.CreateIncidentRequest;
import com.emergency.incident_service.dto.IncidentResponse;
import com.emergency.incident_service.dto.UpdateStatusRequest;
import com.emergency.incident_service.service.IncidentService;
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

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/incidents")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Incidents", description = "Create, query, dispatch, and manage emergency incidents")
public class IncidentController {

    private final IncidentService incidentService;

    private static final String HAS_ANY_ADMIN_ROLE =
        "hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')";

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    /**
     * Returns the incident types the caller is allowed to access,
     * or null for SYSTEM_ADMIN (unrestricted).
     */
    private Collection<IncidentType> allowedTypes(Authentication auth) {
        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .orElse("SYSTEM_ADMIN");
        return switch (role) {
            case "HOSPITAL_ADMIN" -> Set.of(IncidentType.MEDICAL_EMERGENCY, IncidentType.ACCIDENT, IncidentType.OTHER);
            case "POLICE_ADMIN"   -> Set.of(IncidentType.ROBBERY, IncidentType.CRIME, IncidentType.OTHER);
            case "FIRE_ADMIN"     -> Set.of(IncidentType.FIRE, IncidentType.OTHER);
            default               -> null; // SYSTEM_ADMIN — unrestricted
        };
    }

    @PostMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Create a new incident",
        description = """
            Records an emergency incident and automatically dispatches the nearest available responder.
            Department admins may only create incidents matching their department.
            - HOSPITAL_ADMIN: MEDICAL_EMERGENCY, ACCIDENT
            - POLICE_ADMIN:   ROBBERY, CRIME
            - FIRE_ADMIN:     FIRE
            - SYSTEM_ADMIN:   any type
            """
    )
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication auth) {
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(request.getIncidentType())) {
            throw new AccessDeniedException("You may only create incidents of types: " + allowed);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentService.createIncident(request));
    }

    @GetMapping("/open")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Get open incidents", description = "Returns open incidents scoped to the caller's department.")
    public ResponseEntity<List<IncidentResponse>> getOpenIncidents(Authentication auth) {
        return ResponseEntity.ok(incidentService.getOpenIncidents(allowedTypes(auth)));
    }

    @GetMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Get all incidents", description = "Returns incidents scoped to the caller's department.")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents(Authentication auth) {
        return ResponseEntity.ok(incidentService.getAllIncidents(allowedTypes(auth)));
    }

    @GetMapping("/{id}")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Get incident by ID", description = "Retrieves a specific incident if it belongs to the caller's department.")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable UUID id, Authentication auth) {
        IncidentResponse incident = incidentService.getIncident(id);
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(incident.getIncidentType())) {
            throw new AccessDeniedException("Access denied to this incident.");
        }
        return ResponseEntity.ok(incident);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Delete incident", description = "Deletes an incident. Requires SYSTEM_ADMIN.")
    public ResponseEntity<Void> deleteIncident(@PathVariable UUID id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/notes")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Get incident notes", description = "Returns notes for an incident in the caller's department.")
    public ResponseEntity<String> getIncidentNotes(@PathVariable UUID id, Authentication auth) {
        IncidentResponse incident = incidentService.getIncident(id);
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(incident.getIncidentType())) {
            throw new AccessDeniedException("Access denied to this incident.");
        }
        return ResponseEntity.ok(incidentService.getIncidentNotes(id));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Get incident timeline", description = "Returns the audit history for an incident in the caller's department.")
    public ResponseEntity<List<com.emergency.incident_service.dto.IncidentTimelineResponse>> getIncidentTimeline(
            @PathVariable UUID id, Authentication auth) {
        IncidentResponse incident = incidentService.getIncident(id);
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(incident.getIncidentType())) {
            throw new AccessDeniedException("Access denied to this incident.");
        }
        return ResponseEntity.ok(incidentService.getIncidentTimeline(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Update incident status", description = "Updates the status of an incident in the caller's department.")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        IncidentResponse incident = incidentService.getIncident(id);
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(incident.getIncidentType())) {
            throw new AccessDeniedException("Access denied to this incident.");
        }
        return ResponseEntity.ok(incidentService.updateStatus(id, request));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(summary = "Manually assign a responder/unit", description = "Overrides auto-dispatch. Department admins may only dispatch to incidents within their department.")
    public ResponseEntity<IncidentResponse> assignResponder(
            @PathVariable UUID id,
            @Valid @RequestBody AssignUnitRequest request,
            Authentication auth) {
        IncidentResponse incident = incidentService.getIncident(id);
        Collection<IncidentType> allowed = allowedTypes(auth);
        if (allowed != null && !allowed.contains(incident.getIncidentType())) {
            throw new AccessDeniedException("You may only dispatch to incidents within your department.");
        }
        return ResponseEntity.ok(incidentService.assignResponder(id, request));
    }
}
