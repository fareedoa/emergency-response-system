package com.emergency.auth_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Payload for updating user profile")
public class UpdateProfileRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
}
