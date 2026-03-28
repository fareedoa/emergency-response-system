package com.emergency.incident_service.client;

import com.emergency.incident_service.dto.VehicleDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Feign client for querying available (IDLE) vehicles from the tracking-service.
 * The /vehicles/available endpoint is permit-all in the tracking-service security config,
 * so no auth header is required.
 */
@FeignClient(name = "tracking-service", url = "${TRACKING_SERVICE_URL:https://emergency-response-system-2-52xb.onrender.com}")
public interface TrackingServiceClient {

    @GetMapping("/vehicles/available")
    List<VehicleDto> getAvailableVehicles(@RequestParam(required = false) String vehicleTypes);
}
