package com.team04.ewaste.admin;

import com.team04.ewaste.admin.dto.UpdateUserRoleRequest;
import com.team04.ewaste.admin.dto.UpdateUserStatusRequest;
import com.team04.ewaste.admin.dto.UserResponse;
import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        return UserResponse.from(user);
    }

    public UserResponse updateUserRole(UUID userId, UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        String currentAdminEmail = getCurrentAdminEmail();

        // Prevent admin from changing their own role
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && request.getRole() != user.getRole()) {
            throw new IllegalArgumentException("Admin cannot change their own role.");
        }

        user.setRole(request.getRole());
        userRepository.save(user);

        return UserResponse.from(user);
    }

    public UserResponse updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        String normalizedStatus = request.getStatus().trim().toLowerCase();

        if (!normalizedStatus.equals("active") && !normalizedStatus.equals("disabled")) {
            throw new IllegalArgumentException("Status must be either 'active' or 'disabled'");
        }

        String currentAdminEmail = getCurrentAdminEmail();

        // Prevent admin from disabling their own account
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && normalizedStatus.equals("disabled")) {
            throw new IllegalArgumentException("Admin cannot disable their own account.");
        }

        user.setStatus(normalizedStatus);
        userRepository.save(user);

        return UserResponse.from(user);
    }

    private String getCurrentAdminEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}