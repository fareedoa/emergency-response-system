package com.emergency.incident_service.domain.model;

import com.emergency.incident_service.domain.enums.IncidentStatus;
import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.enums.Severity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incidents")
@EntityListeners(AuditingEntityListener.class)
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "citizen_name", nullable = false)
    private String citizenName;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false)
    private IncidentType incidentType;

    @Column(name = "other_incident_type")
    private String otherIncidentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "assigned_unit")
    private UUID assignedUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.CREATED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
