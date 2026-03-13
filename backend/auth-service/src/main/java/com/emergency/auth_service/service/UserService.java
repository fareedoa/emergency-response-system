package com.emergency.auth_service.service;

import com.emergency.auth_service.domain.model.User;
import com.emergency.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateUserStatus(UUID userId, boolean isEnabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setEnabled(isEnabled);
        userRepository.save(user);
    }
}
