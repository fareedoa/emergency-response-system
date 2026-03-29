package com.emergency.auth_service.dto;

import com.emergency.auth_service.domain.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private UUID userId;
    private String name;
    private String email;
    private Role role;
    private boolean enabled;
}
