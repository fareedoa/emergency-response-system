package com.emergency.analytics_service.client;

import com.emergency.analytics_service.dto.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "auth-service", url = "${AUTH_SERVICE_URL:http://localhost:8081}")
public interface AuthServiceClient {

    @GetMapping("/auth/profile")
    UserProfileResponse getProfile(@RequestHeader("Authorization") String bearerToken);
}
