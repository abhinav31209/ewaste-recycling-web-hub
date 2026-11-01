package com.team04.ewaste.auth.dto;

import java.util.UUID;

public class AuthResponse {

    private boolean success;
    private String message;
    private UUID userId;
    private String email;
    private String role;

    public AuthResponse() {}

    public AuthResponse(boolean success, String message, UUID userId, String email, String role) {
        this.success = success;
        this.message = message;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public UUID getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getRole() { return role; }

    public void setSuccess(boolean success) { this.success = success; }
    public void setMessage(String message) { this.message = message; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
}