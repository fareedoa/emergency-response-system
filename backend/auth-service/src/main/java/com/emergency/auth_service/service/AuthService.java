package com.emergency.auth_service.service;

import com.emergency.auth_service.domain.model.RefreshToken;
import com.emergency.auth_service.domain.model.User;
import com.emergency.auth_service.dto.*;
import com.emergency.auth_service.exception.InvalidTokenException;
import com.emergency.auth_service.exception.UserAlreadyExistsException;
import com.emergency.auth_service.repository.RefreshTokenRepository;
import com.emergency.auth_service.repository.UserRepository;
import com.emergency.auth_service.security.CustomUserDetailsService;
import com.emergency.auth_service.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       RefreshTokenService refreshTokenService,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       AuthenticationManager authenticationManager,
                       CustomUserDetailsService userDetailsService,
                       TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(
                    "A user with email '" + request.getEmail() + "' already exists.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        user = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtUtils.generateAccessToken(userDetails);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLogin(java.time.LocalDateTime.now());
        userRepository.save(user);

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException(
                        "Refresh token not found. Please login again."));

        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtUtils.generateAccessToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        return UserProfileResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdDate(user.getCreatedDate())
                .updatedAt(user.getUpdatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        user.setName(request.getName());
        user = userRepository.save(user);

        return UserProfileResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdDate(user.getCreatedDate())
                .updatedAt(user.getUpdatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    @Transactional
    public void updatePassword(String email, UpdatePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid old password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    @Transactional
    public void logout(String email, String accessToken) {
        // 1. Blacklist the access token in Redis (auto-expires at token TTL)
        if (accessToken != null) {
            long remainingMs = jwtUtils.getRemainingExpiryMs(accessToken);
            tokenBlacklistService.blacklist(accessToken, remainingMs);
        }
        // 2. Delete the refresh token from the database
        userRepository.findByEmail(email)
                .ifPresent(refreshTokenService::deleteByUser);
    }
}
