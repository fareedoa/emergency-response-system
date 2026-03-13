package com.emergency.auth_service.config;

import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "revinfo")
@RevisionEntity(UserRevisionListener.class)
@Getter
@Setter
public class UserRevisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @RevisionNumber
    private int id;

    @RevisionTimestamp
    private long timestamp;

    private String username;
}
