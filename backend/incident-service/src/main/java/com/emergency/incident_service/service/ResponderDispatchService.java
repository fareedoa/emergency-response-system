package com.emergency.incident_service.service;

import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.domain.enums.ResponderType;
import com.emergency.incident_service.domain.model.Responder;
import com.emergency.incident_service.exception.ResourceNotFoundException;
import com.emergency.incident_service.repository.ResponderRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class ResponderDispatchService {

    private final ResponderRepository responderRepository;
    private final GeoCalculationService geoCalcService;

    public ResponderDispatchService(ResponderRepository responderRepository,
                                    GeoCalculationService geoCalcService) {
        this.responderRepository = responderRepository;
        this.geoCalcService = geoCalcService;
    }

    public Responder findNearestAvailableResponder(IncidentType incidentType,
                                                   double incidentLat,
                                                   double incidentLon) {
        ResponderType requiredType = mapToResponderType(incidentType);

        List<Responder> candidates = responderRepository
                .findByResponderTypeAndAvailableTrue(requiredType);

        if (candidates.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No available " + requiredType + " responders at this time.");
        }

        return candidates.stream()
                .min(Comparator.comparingDouble(r ->
                        geoCalcService.calculateDistanceKm(
                                incidentLat, incidentLon,
                                r.getLatitude(), r.getLongitude())))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Could not determine nearest responder."));
    }

    private ResponderType mapToResponderType(IncidentType incidentType) {
        return switch (incidentType) {
            case ROBBERY, CRIME      -> ResponderType.POLICE;
            case FIRE                -> ResponderType.FIRE;
            case MEDICAL_EMERGENCY, ACCIDENT   -> ResponderType.AMBULANCE;
            case OTHER -> null;
        };
    }
}
