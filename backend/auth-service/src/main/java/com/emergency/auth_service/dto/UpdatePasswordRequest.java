package com.emergency.auth_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Payload for resetting user password")
public class UpdatePasswordRequest {
    
    @NotBlank(message = "Old password is required")
    private String oldPassword;
    
    @NotBlank(message = "New password is required")
    private String newPassword;
}
