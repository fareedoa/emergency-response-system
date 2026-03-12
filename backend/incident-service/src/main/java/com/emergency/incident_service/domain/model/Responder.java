package com.emergency.incident_service.domain.model;

import com.emergency.incident_service.domain.enums.ResponderType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "responders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Responder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "responder_type", nullable = false)
    private ResponderType responderType;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "available", nullable = false)
    @Builder.Default
    private boolean available = true;
}
