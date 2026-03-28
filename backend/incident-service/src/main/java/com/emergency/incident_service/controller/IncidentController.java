package com.emergency.incident_service.controller;

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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/incidents")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Incidents", description = "Create, query, dispatch, and manage emergency incidents")
public class IncidentController {

    private final IncidentService incidentService;

    // Define constant for allowed roles to avoid repetition
    private static final String HAS_ANY_ADMIN_ROLE = 
        "hasAnyRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'POLICE_ADMIN', 'FIRE_ADMIN')";

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    /**
     * POST /incidents
     * Creates a new incident report and automatically dispatches the nearest
     * available responder based on incident type and GPS location.
     */
    @PostMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Create a new incident",
        description = """
            Records an emergency incident report and automatically dispatches the nearest
            available responder:
            - ROBBERY / CRIME → nearest Police Station
            - FIRE            → nearest Fire Service Station
            - MEDICAL_EMERGENCY → nearest available Ambulance
            
            Returns DISPATCHED status if a responder was assigned, or CREATED if none were available.
            """
    )
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentService.createIncident(request));
    }

    /**
     * GET /incidents/open
     * Must be declared BEFORE /incidents/{id} to avoid Spring treating "open" as a UUID path variable.
     */
    @GetMapping("/open")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get all open incidents",
        description = "Returns all incidents with status CREATED, DISPATCHED, or IN_PROGRESS."
    )
    public ResponseEntity<List<IncidentResponse>> getOpenIncidents() {
        return ResponseEntity.ok(incidentService.getOpenIncidents());
    }

    /**
     * GET /incidents
     */
    @GetMapping
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get all incidents",
        description = "Returns all incidents regardless of status."
    )
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    /**
     * GET /incidents/:id
     */
    @GetMapping("/{id}")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get incident by ID",
        description = "Retrieves the full details of a specific incident."
    )
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getIncident(id));
    }

    /**
     * DELETE /incidents/:id
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(
        summary = "Delete incident",
        description = "Deletes an incident and frees any assigned responder. Requires SYSTEM_ADMIN role."
    )
    public ResponseEntity<Void> deleteIncident(@PathVariable UUID id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /incidents/:id/notes
     */
    @GetMapping("/{id}/notes")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get incident notes",
        description = "Retrieves the notes associated with a specific incident."
    )
    public ResponseEntity<String> getIncidentNotes(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getIncidentNotes(id));
    }

    /**
     * GET /incidents/:id/timeline
     */
    @GetMapping("/{id}/timeline")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Get incident timeline",
        description = "Retrieves the complete audit history of an incident's status and modifications."
    )
    public ResponseEntity<List<com.emergency.incident_service.dto.IncidentTimelineResponse>> getIncidentTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getIncidentTimeline(id));
    }

    /**
     * PUT /incidents/:id/status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize(HAS_ANY_ADMIN_ROLE)
    @Operation(
        summary = "Update incident status",
        description = """
            Transitions the incident to a new status (CREATED → DISPATCHED → IN_PROGRESS → RESOLVED).
            When an incident is resolved, the assigned responder is automatically marked available again.
            """
    )
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(incidentService.updateStatus(id, request));
    }

    /**
     * PUT /incidents/:id/assign
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(
        summary = "Manually assign a responder/unit",
        description = """
            Overrides the auto-dispatched responder. 
            The previously assigned responder (if any) is freed and the new one is marked unavailable.
            
            Requires ROLE_SYSTEM_ADMIN.
            """
    )
    public ResponseEntity<IncidentResponse> assignResponder(
            @PathVariable UUID id,
            @Valid @RequestBody AssignUnitRequest request) {
        return ResponseEntity.ok(incidentService.assignResponder(id, request));
    }
}
