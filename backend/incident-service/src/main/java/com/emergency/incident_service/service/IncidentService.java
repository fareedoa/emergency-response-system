package com.emergency.incident_service.service;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.domain.model.Incident;
import com.emergency.incident_service.dto.AssignUnitRequest;
import com.emergency.incident_service.dto.CreateIncidentRequest;
import com.emergency.incident_service.dto.IncidentResponse;
import com.emergency.incident_service.dto.UpdateStatusRequest;
import com.emergency.incident_service.exception.ResourceNotFoundException;
import com.emergency.incident_service.messaging.RabbitMQConfig;
import com.emergency.incident_service.messaging.events.IncidentCreatedEvent;
import com.emergency.incident_service.messaging.events.IncidentStatusChangedEvent;
import com.emergency.incident_service.repository.IncidentRepository;
import com.emergency.incident_service.repository.ResponderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final ResponderRepository responderRepository;
    private final ResponderDispatchService dispatchService;
    private final EntityManager entityManager;
    private final RabbitTemplate rabbitTemplate;

    public IncidentService(IncidentRepository incidentRepository,
                           ResponderRepository responderRepository,
                           ResponderDispatchService dispatchService,
                           EntityManager entityManager,
                           RabbitTemplate rabbitTemplate) {
        this.incidentRepository = incidentRepository;
        this.responderRepository = responderRepository;
        this.dispatchService = dispatchService;
        this.entityManager = entityManager;
        this.rabbitTemplate = rabbitTemplate;
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

        // Publish incident.created event
        publishCreatedEvent(incident);

        // Auto-dispatch: find nearest IDLE vehicle from tracking-service
        try {
            UUID vehicleId = dispatchService.findNearestAvailableVehicle(
                    request.getIncidentType(),
                    request.getLatitude(),
                    request.getLongitude());

            incident.setAssignedUnit(vehicleId);
            incident.setStatus(IncidentStatus.DISPATCHED);

            // MEDICAL_EMERGENCY edge-case: also select nearest hospital with capacity
            if (request.getIncidentType() == com.emergency.incident_service.domain.enums.IncidentType.MEDICAL_EMERGENCY) {
                dispatchService.findNearestHospitalWithBeds(
                        request.getLatitude(), request.getLongitude())
                        .ifPresent(incident::setHospitalId);
            }

            incident = incidentRepository.save(incident);

            // Publish incident.dispatched event
            publishStatusChangedEvent(incident, IncidentStatus.CREATED, IncidentStatus.DISPATCHED);
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

        Incident saved = incidentRepository.save(incident);

        // Publish incident.status.<STATUS> for analytics
        publishStatusChangedEvent(saved, previousStatus, saved.getStatus());

        // Also publish dedicated incident.resolved for tracking-service
        if (saved.getStatus() == IncidentStatus.RESOLVED) {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.RK_INCIDENT_RESOLVED,
                    IncidentStatusChangedEvent.builder()
                            .incidentId(saved.getId())
                            .previousStatus(previousStatus)
                            .newStatus(IncidentStatus.RESOLVED)
                            .assignedUnit(saved.getAssignedUnit())
                            .changedAt(LocalDateTime.now())
                            .build());
            log.info("Published incident.resolved for incidentId={}", saved.getId());
        }

        return toResponse(saved);
    }

    /** PUT /incidents/:id/assign – manual override */
    @Transactional
    public IncidentResponse assignResponder(UUID id, AssignUnitRequest request) {
        Incident incident = findOrThrow(id);
        IncidentStatus previousStatus = incident.getStatus();

        // Release previously assigned responder if any
        if (incident.getAssignedUnit() != null) {
            responderRepository.findById(incident.getAssignedUnit())
                    .ifPresent(prev -> {
                        prev.setAvailable(true);
                        responderRepository.save(prev);
                    });
        }

        incident.setAssignedUnit(request.getUnitId());
        incident.setStatus(IncidentStatus.DISPATCHED);

        Incident saved = incidentRepository.save(incident);

        // Publish incident.dispatched
        publishStatusChangedEvent(saved, previousStatus, IncidentStatus.DISPATCHED);

        return toResponse(saved);
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private void publishCreatedEvent(Incident incident) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.RK_INCIDENT_CREATED,
                    IncidentCreatedEvent.builder()
                            .incidentId(incident.getId())
                            .incidentType(incident.getIncidentType())
                            .severity(incident.getSeverity())
                            .latitude(incident.getLatitude())
                            .longitude(incident.getLongitude())
                            .createdBy(incident.getCreatedBy())
                            .createdAt(incident.getCreatedAt())
                            .build());
            log.info("Published incident.created for incidentId={}", incident.getId());
        } catch (Exception e) {
            log.error("Failed to publish incident.created for incidentId={}: {}",
                      incident.getId(), e.getMessage());
        }
    }

    private void publishStatusChangedEvent(Incident incident,
                                            IncidentStatus previousStatus,
                                            IncidentStatus newStatus) {
        try {
            String routingKey = RabbitMQConfig.RK_INCIDENT_STATUS_PREFIX + newStatus.name();
            // Also use the dedicated dispatched key
            if (newStatus == IncidentStatus.DISPATCHED) {
                routingKey = RabbitMQConfig.RK_INCIDENT_DISPATCHED;
            }
            IncidentStatusChangedEvent event = IncidentStatusChangedEvent.builder()
                    .incidentId(incident.getId())
                    .previousStatus(previousStatus)
                    .newStatus(newStatus)
                    .assignedUnit(incident.getAssignedUnit())
                    .destinationLat(incident.getLatitude())
                    .destinationLng(incident.getLongitude())
                    .changedAt(LocalDateTime.now())
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
            log.info("Published {} for incidentId={}", routingKey, incident.getId());
        } catch (Exception e) {
            log.error("Failed to publish status event for incidentId={}: {}",
                      incident.getId(), e.getMessage());
        }
    }

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
                .hospitalId(i.getHospitalId())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
