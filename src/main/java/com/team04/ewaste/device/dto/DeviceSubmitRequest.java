package com.team04.ewaste.device.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class DeviceSubmitRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String deviceName;

    private String brand;

    private String condition;

    public UUID getUserId() { return userId; }

    public String getDeviceName() { return deviceName; }

    public String getBrand() { return brand; }

    public String getCondition() { return condition; }

    public void setUserId(UUID userId) { this.userId = userId; }

    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public void setBrand(String brand) { this.brand = brand; }

    public void setCondition(String condition) { this.condition = condition; }
}