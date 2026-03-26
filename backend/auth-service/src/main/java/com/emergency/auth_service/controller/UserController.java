package com.emergency.auth_service.controller;

import com.emergency.auth_service.dto.UserProfileResponse;
import com.emergency.auth_service.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@Tag(name = "User Management", description = "Endpoints for administrators to manage user accounts")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List all users", description = "Returns all registered users. Requires SYSTEM_ADMIN role.")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<List<UserProfileResponse>> listUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a user account",
               description = "Enables a user account. Only accessible by administrators.")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable("id") UUID id) {
        userService.updateUserStatus(id, true);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a user account",
               description = "Disables a user account. Only accessible by administrators.")
    @PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable("id") UUID id) {
        userService.updateUserStatus(id, false);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }
}
