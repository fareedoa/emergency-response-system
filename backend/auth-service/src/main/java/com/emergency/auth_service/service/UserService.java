package com.emergency.auth_service.service;

import com.emergency.auth_service.domain.model.User;
import com.emergency.auth_service.dto.UserProfileResponse;
import com.emergency.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserProfileResponse> listAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> UserProfileResponse.builder()
                        .userId(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .enabled(u.isEnabled())
                        .createdDate(u.getCreatedDate())
                        .updatedAt(u.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(UUID userId, boolean isEnabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setEnabled(isEnabled);
        userRepository.save(user);
    }
}
