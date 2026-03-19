package com.emergency.analytics_service.domain.incident;

import com.emergency.analytics_service.domain.enums.ResponderType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "responders")
@Getter
@Setter
@NoArgsConstructor
public class ResponderRecord {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "responder_type", nullable = false)
    private ResponderType responderType;

    @Column(name = "available", nullable = false)
    private boolean available;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
