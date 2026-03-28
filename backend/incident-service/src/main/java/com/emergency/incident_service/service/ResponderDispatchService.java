package com.emergency.incident_service.service;

import com.emergency.incident_service.client.TrackingServiceClient;
import com.emergency.incident_service.domain.enums.IncidentType;
import com.emergency.incident_service.dto.VehicleDto;
import com.emergency.incident_service.exception.ResourceNotFoundException;
import com.emergency.incident_service.messaging.HospitalCapacityListener;
import com.emergency.incident_service.messaging.events.HospitalCapacityEvent;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ResponderDispatchService {

    private final TrackingServiceClient    trackingClient;
    private final GeoCalculationService    geoCalcService;
    private final HospitalCapacityListener hospitalCapacityListener;

    public ResponderDispatchService(TrackingServiceClient trackingClient,
                                    GeoCalculationService geoCalcService,
                                    HospitalCapacityListener hospitalCapacityListener) {
        this.trackingClient           = trackingClient;
        this.geoCalcService           = geoCalcService;
        this.hospitalCapacityListener = hospitalCapacityListener;
    }

    /**
     * Finds the UUID of the nearest IDLE vehicle in the tracking-service whose
     * type matches the incident type:
     * <ul>
     *   <li>MEDICAL_EMERGENCY / ACCIDENT  → AMBULANCE</li>
     *   <li>CRIME / ROBBERY               → POLICE_CAR or PATROL_BIKE (nearest of either)</li>
     *   <li>FIRE                          → FIRE_TRUCK</li>
     *   <li>OTHER                         → no auto-dispatch (throws)</li>
     * </ul>
     */
    public UUID findNearestAvailableVehicle(IncidentType incidentType,
                                            double incidentLat,
                                            double incidentLon) {
        String vehicleTypes = mapToVehicleTypes(incidentType);

        List<VehicleDto> candidates;
        try {
            candidates = trackingClient.getAvailableVehicles(vehicleTypes);
        } catch (Exception e) {
            throw new ResourceNotFoundException(
                    "Could not reach tracking-service to find vehicles: " + e.getMessage());
        }

        // Only dispatch to vehicles with a known GPS position
        candidates = candidates.stream()
                .filter(v -> v.getCurrentLat() != null && v.getCurrentLng() != null)
                .toList();

        if (candidates.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No available [" + vehicleTypes + "] vehicles with GPS at this time.");
        }

        return candidates.stream()
                .min(Comparator.comparingDouble(v ->
                        geoCalcService.calculateDistanceKm(
                                incidentLat, incidentLon,
                                v.getCurrentLat(), v.getCurrentLng())))
                .map(VehicleDto::getId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Could not determine nearest vehicle."));
    }

    /**
     * For MEDICAL_EMERGENCY: finds the nearest hospital from the capacity cache
     * that has at least one free bed (totalBeds > occupiedBeds).
     */
    public Optional<String> findNearestHospitalWithBeds(double incidentLat, double incidentLon) {
        Map<String, HospitalCapacityEvent> allCapacities = hospitalCapacityListener.getAllCapacities();

        return allCapacities.values().stream()
                .filter(h -> h.getTotalBeds() > h.getOccupiedBeds())
                .min(Comparator.comparingDouble(h ->
                        geoCalcService.calculateDistanceKm(
                                incidentLat, incidentLon,
                                h.getLatitude().doubleValue(),
                                h.getLongitude().doubleValue())))
                .map(HospitalCapacityEvent::getHospitalId);
    }

    /**
     * Maps an incident type to a comma-separated string of eligible VehicleType names.
     * Sent as the {@code vehicleTypes} query param to the tracking-service.
     */
    private String mapToVehicleTypes(IncidentType incidentType) {
        return switch (incidentType) {
            case MEDICAL_EMERGENCY, ACCIDENT -> "AMBULANCE";
            case CRIME, ROBBERY              -> "POLICE_CAR,PATROL_BIKE";
            case FIRE                        -> "FIRE_TRUCK";
            case OTHER -> throw new ResourceNotFoundException(
                    "No auto-dispatch for incident type OTHER — manual assignment required.");
        };
    }
}
