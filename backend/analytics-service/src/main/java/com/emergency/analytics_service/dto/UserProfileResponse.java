package com.emergency.analytics_service.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}
