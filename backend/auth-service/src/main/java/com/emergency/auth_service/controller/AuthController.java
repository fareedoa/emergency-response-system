package com.emergency.auth_service.controller;

import com.emergency.auth_service.dto.*;
import com.emergency.auth_service.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, login, token management, and profile access")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new system user",
               description = "Creates a new user account for system, hospital, police, or fire service administrators.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login and obtain JWT tokens",
               description = "Authenticates credentials and returns a JWT access token and refresh token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh an access token",
               description = "Accepts a valid refresh token and issues a new access token.")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile",
               description = "Returns profile information for the currently authenticated user.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = authService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile",
               description = "Updates the name of the currently authenticated user.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/password")
    @Operation(summary = "Change password",
               description = "Allows an authenticated user to change their password.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.updatePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke tokens",
               description = "Blacklists the current access token in Redis and deletes the user's refresh token from the database.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String jwt = extractJwt(request);
        authService.logout(userDetails.getUsername(), jwt);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private String extractJwt(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
