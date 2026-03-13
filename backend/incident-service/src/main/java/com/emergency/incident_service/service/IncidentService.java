package com.emergency.incident_service.service;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.domain.model.Incident;
import com.emergency.incident_service.domain.model.Responder;
import com.emergency.incident_service.dto.AssignResponderRequest;
import com.emergency.incident_service.dto.CreateIncidentRequest;
import com.emergency.incident_service.dto.IncidentResponse;
import com.emergency.incident_service.dto.UpdateStatusRequest;
import com.emergency.incident_service.exception.ResourceNotFoundException;
import com.emergency.incident_service.repository.IncidentRepository;
import com.emergency.incident_service.repository.ResponderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.hibernate.envers.RevisionType;

import com.emergency.incident_service.config.UserRevisionEntity;
import com.emergency.incident_service.dto.IncidentTimelineResponse;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ResponderRepository responderRepository;
    private final ResponderDispatchService dispatchService;
    private final EntityManager entityManager;

    public IncidentService(IncidentRepository incidentRepository,
                           ResponderRepository responderRepository,
                           ResponderDispatchService dispatchService,
                           EntityManager entityManager) {
        this.incidentRepository = incidentRepository;
        this.responderRepository = responderRepository;
        this.dispatchService = dispatchService;
        this.entityManager = entityManager;
    }

    /**
     * Creates a new incident and automatically dispatches the nearest
     * available responder based on incident type and location.
     */
    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request) {
        // Build and persist the incident with CREATED status
        Incident incident = Incident.builder()
                .citizenName(request.getCitizenName())
                .incidentType(request.getIncidentType())
                .otherIncidentType(request.getOtherIncidentType())
                .severity(request.getSeverity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .notes(request.getNotes())
                .status(IncidentStatus.CREATED)
                .build();

        incident = incidentRepository.save(incident);

        // Auto-dispatch: find nearest available responder
        try {
            Responder nearest = dispatchService.findNearestAvailableResponder(
                    request.getIncidentType(),
                    request.getLatitude(),
                    request.getLongitude());

            // Mark responder unavailable and link to incident
            nearest.setAvailable(false);
            responderRepository.save(nearest);

            incident.setAssignedUnit(nearest.getId());
            incident.setStatus(IncidentStatus.DISPATCHED);
            incident = incidentRepository.save(incident);
        } catch (ResourceNotFoundException e) {
            // No available responder — incident stays CREATED with no assignment
        }

        return toResponse(incident);
    }

    /** GET /incidents/:id */
    @Transactional(readOnly = true)
    public IncidentResponse getIncident(UUID id) {
        Incident incident = findOrThrow(id);
        return toResponse(incident);
    }

    /** GET /incidents/open – all non-resolved incidents */
    @Transactional(readOnly = true)
    public List<IncidentResponse> getOpenIncidents() {
        return incidentRepository.findByStatusNot(IncidentStatus.RESOLVED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** GET /incidents – all incidents */
    @Transactional(readOnly = true)
    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** DELETE /incidents/:id */
    @Transactional
    public void deleteIncident(UUID id) {
        Incident incident = findOrThrow(id);

        if (incident.getAssignedUnit() != null) {
            responderRepository.findById(incident.getAssignedUnit())
                    .ifPresent(r -> {
                        r.setAvailable(true);
                        responderRepository.save(r);
                    });
        }
        incidentRepository.delete(incident);
    }

    /** GET /incidents/:id/notes */
    @Transactional(readOnly = true)
    public String getIncidentNotes(UUID id) {
        Incident incident = findOrThrow(id);
        return incident.getNotes() != null ? incident.getNotes() : "";
    }

    /** GET /incidents/:id/responders/nearest */
    @Transactional(readOnly = true)
    public Responder getNearestResponderForIncident(UUID id) {
        Incident incident = findOrThrow(id);
        return dispatchService.findNearestAvailableResponder(
                incident.getIncidentType(),
                incident.getLatitude(),
                incident.getLongitude()
        );
    }

    /** GET /incidents/:id/timeline */
    @Transactional(readOnly = true)
    public List<IncidentTimelineResponse> getIncidentTimeline(UUID id) {
        AuditReader auditReader = AuditReaderFactory.get(entityManager);
        
        AuditQuery query = auditReader.createQuery()
                .forRevisionsOfEntity(Incident.class, false, true)
                .add(AuditEntity.id().eq(id));

        List<Object[]> results = query.getResultList();

        return results.stream().map(result -> {
            Incident auditedIncident = (Incident) result[0];
            UserRevisionEntity revisionEntity = (UserRevisionEntity) result[1];
            RevisionType revisionType = (RevisionType) result[2];

            return IncidentTimelineResponse.builder()
                    .status(auditedIncident.getStatus())
                    .modifiedBy(revisionEntity.getUsername())
                    .modifiedAt(java.time.Instant.ofEpochMilli(revisionEntity.getTimestamp())
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime())
                    .updateType(revisionType.name())
                    .build();
        }).collect(Collectors.toList());
    }

    /** PUT /incidents/:id/status */
    @Transactional
    public IncidentResponse updateStatus(UUID id, UpdateStatusRequest request) {
        Incident incident = findOrThrow(id);
        IncidentStatus previousStatus = incident.getStatus();
        incident.setStatus(request.getStatus());

        // If resolving: free up the assigned responder
        if (request.getStatus() == IncidentStatus.RESOLVED
                && incident.getAssignedUnit() != null) {
            responderRepository.findById(incident.getAssignedUnit())
                    .ifPresent(r -> {
                        r.setAvailable(true);
                        responderRepository.save(r);
                    });
        }

        return toResponse(incidentRepository.save(incident));
    }

    /** PUT /incidents/:id/assign – manual override */
    @Transactional
    public IncidentResponse assignResponder(UUID id, AssignResponderRequest request) {
        Incident incident = findOrThrow(id);

        Responder responder = responderRepository.findById(request.getResponderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Responder not found with ID: " + request.getResponderId()));

        // Release previously assigned responder if any
        if (incident.getAssignedUnit() != null
                && !incident.getAssignedUnit().equals(request.getResponderId())) {
            responderRepository.findById(incident.getAssignedUnit())
                    .ifPresent(prev -> {
                        prev.setAvailable(true);
                        responderRepository.save(prev);
                    });
        }

        responder.setAvailable(false);
        responderRepository.save(responder);

        incident.setAssignedUnit(responder.getId());
        incident.setStatus(IncidentStatus.DISPATCHED);

        return toResponse(incidentRepository.save(incident));
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private Incident findOrThrow(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Incident not found with ID: " + id));
    }

    private IncidentResponse toResponse(Incident i) {
        return IncidentResponse.builder()
                .id(i.getId())
                .citizenName(i.getCitizenName())
                .incidentType(i.getIncidentType())
                .otherIncidentType(i.getOtherIncidentType())
                .severity(i.getSeverity())
                .latitude(i.getLatitude())
                .longitude(i.getLongitude())
                .notes(i.getNotes())
                .createdBy(i.getCreatedBy())
                .assignedUnit(i.getAssignedUnit())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
