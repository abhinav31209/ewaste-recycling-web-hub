package com.team04.ewaste.staff.dto;

import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceDataWipeStatus;
import com.team04.ewaste.device.DeviceType;
import com.team04.ewaste.device.DeviceWorkflowStatus;

import java.time.Instant;
import java.util.UUID;

public class DeviceResponse {

    public UUID id;
    public UUID userId;
    public String deviceName;
    public String brand;
    public String condition;
    public DeviceType deviceType;
    public DeviceClassification classification;
    public DeviceWorkflowStatus workflowStatus;
    public DeviceDataWipeStatus dataWipeStatus;
    public Instant dataWipeCompletedAt;
    public UUID dataWipeCompletedBy;
    public Boolean retrievalAvailable;
    public Instant retrievalAvailableAt;
    public Instant retrievalAvailableUntil;
    public Instant createdAt;
    public Instant updatedAt;

    public DeviceResponse(UUID id,
                          UUID userId,
                          String deviceName,
                          String brand,
                          String condition,
                          DeviceType deviceType,
                          DeviceClassification classification,
                          DeviceWorkflowStatus workflowStatus,
                          DeviceDataWipeStatus dataWipeStatus,
                          Instant dataWipeCompletedAt,
                          UUID dataWipeCompletedBy,
                          Boolean retrievalAvailable,
                          Instant retrievalAvailableAt,
                          Instant retrievalAvailableUntil,
                          Instant createdAt,
                          Instant updatedAt) {

        this.id = id;
        this.userId = userId;
        this.deviceName = deviceName;
        this.brand = brand;
        this.condition = condition;
        this.deviceType = deviceType;
        this.classification = classification;
        this.workflowStatus = workflowStatus;
        this.dataWipeStatus = dataWipeStatus;
        this.dataWipeCompletedAt = dataWipeCompletedAt;
        this.dataWipeCompletedBy = dataWipeCompletedBy;
        this.retrievalAvailable = retrievalAvailable;
        this.retrievalAvailableAt = retrievalAvailableAt;
        this.retrievalAvailableUntil = retrievalAvailableUntil;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
