package com.emergency.incident_service.repository;

import com.emergency.incident_service.domain.enums.ResponderType;
import com.emergency.incident_service.domain.model.Responder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResponderRepository extends JpaRepository<Responder, UUID> {

    List<Responder> findByResponderTypeAndAvailableTrue(ResponderType responderType);
}
