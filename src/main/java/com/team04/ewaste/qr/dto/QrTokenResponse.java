package com.team04.ewaste.qr.dto;

import java.time.LocalDateTime;

public class QrTokenResponse {

    private String token;
    private LocalDateTime expiresAt;

    public QrTokenResponse() {
    }

    public QrTokenResponse(String token, LocalDateTime expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}