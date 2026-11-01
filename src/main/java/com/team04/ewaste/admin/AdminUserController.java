package com.team04.ewaste.admin;

import com.team04.ewaste.admin.dto.UpdateUserRoleRequest;
import com.team04.ewaste.admin.dto.UpdateUserStatusRequest;
import com.team04.ewaste.admin.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return adminUserService.getUserById(id);
    }

    @PutMapping("/{id}/role")
    public UserResponse updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return adminUserService.updateUserRole(id, request);
    }

    @PutMapping("/{id}/status")
    public UserResponse updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        return adminUserService.updateUserStatus(id, request);
    }
}