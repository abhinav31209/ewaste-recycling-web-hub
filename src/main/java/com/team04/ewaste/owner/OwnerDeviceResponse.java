package com.team04.ewaste.owner;

import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceDataWipeStatus;
import com.team04.ewaste.device.DeviceType;
import com.team04.ewaste.device.DeviceWorkflowStatus;

import java.time.Instant;
import java.util.UUID;

public class OwnerDeviceResponse {

    private UUID id;
    private String deviceName;
    private String brand;
    private String condition;
    private DeviceType deviceType;
    private DeviceClassification classification;
    private DeviceWorkflowStatus workflowStatus;
    private DeviceDataWipeStatus dataWipeStatus;
    private Instant dataWipeCompletedAt;
    private UUID dataWipeCompletedBy;
    private Boolean retrievalAvailable;
    private Instant retrievalAvailableAt;
    private Instant retrievalAvailableUntil;
    private String statusLabel;
    private String resultMessage;
    private Instant createdAt;
    private Instant updatedAt;

    public OwnerDeviceResponse() {}

    public OwnerDeviceResponse(UUID id,
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
                           String statusLabel,
                           String resultMessage,
                           Instant createdAt,
                           Instant updatedAt) {
        this.id = id;
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
        this.statusLabel = statusLabel;
        this.resultMessage = resultMessage;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public String getDeviceName() { return deviceName; }
    public String getBrand() { return brand; }
    public String getCondition() { return condition; }
    public DeviceType getDeviceType() { return deviceType; }
    public DeviceClassification getClassification() { return classification; }
    public DeviceWorkflowStatus getWorkflowStatus() { return workflowStatus; }
    public DeviceDataWipeStatus getDataWipeStatus() { return dataWipeStatus; }
    public Instant getDataWipeCompletedAt() { return dataWipeCompletedAt; }
    public UUID getDataWipeCompletedBy() { return dataWipeCompletedBy; }
    public Boolean getRetrievalAvailable() { return retrievalAvailable; }
    public Instant getRetrievalAvailableAt() { return retrievalAvailableAt; }
    public Instant getRetrievalAvailableUntil() { return retrievalAvailableUntil; }
    public String getStatusLabel() { return statusLabel; }
    public String getResultMessage() { return resultMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(UUID id) { this.id = id; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setCondition(String condition) { this.condition = condition; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }
    public void setClassification(DeviceClassification classification) { this.classification = classification; }
    public void setWorkflowStatus(DeviceWorkflowStatus workflowStatus) { this.workflowStatus = workflowStatus; }
    public void setDataWipeStatus(DeviceDataWipeStatus dataWipeStatus) { this.dataWipeStatus = dataWipeStatus; }
    public void setDataWipeCompletedAt(Instant dataWipeCompletedAt) { this.dataWipeCompletedAt = dataWipeCompletedAt; }
    public void setDataWipeCompletedBy(UUID dataWipeCompletedBy) { this.dataWipeCompletedBy = dataWipeCompletedBy; }
    public void setRetrievalAvailable(Boolean retrievalAvailable) { this.retrievalAvailable = retrievalAvailable; }
    public void setRetrievalAvailableAt(Instant retrievalAvailableAt) { this.retrievalAvailableAt = retrievalAvailableAt; }
    public void setRetrievalAvailableUntil(Instant retrievalAvailableUntil) { this.retrievalAvailableUntil = retrievalAvailableUntil; }
    public void setStatusLabel(String statusLabel) { this.statusLabel = statusLabel; }
    public void setResultMessage(String resultMessage) { this.resultMessage = resultMessage; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
