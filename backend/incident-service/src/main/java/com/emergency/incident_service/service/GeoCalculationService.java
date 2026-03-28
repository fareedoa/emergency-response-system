package com.emergency.incident_service.service;

import org.springframework.stereotype.Service;

@Service
public class GeoCalculationService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    public double calculateDistanceKm(double lat1, double lon1,
                                      double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        // Haversine: d = 2r * arcsin( sqrt(a) )
        double c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS_KM * c;
    }
}
