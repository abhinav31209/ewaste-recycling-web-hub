package com.team04.ewaste.qr.dto;

import java.util.UUID;

public class QrDeviceResponse {

    private UUID deviceId;
    private String brand;
    private String deviceName;
    private String condition;
    private String classification;
    private String workflowStatus;

    public QrDeviceResponse() {
    }

    public QrDeviceResponse(UUID deviceId, String brand, String deviceName,
                            String condition, String classification, String workflowStatus) {
        this.deviceId = deviceId;
        this.brand = brand;
        this.deviceName = deviceName;
        this.condition = condition;
        this.classification = classification;
        this.workflowStatus = workflowStatus;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getClassification() {
        return classification;
    }

    public void setClassification(String classification) {
        this.classification = classification;
    }

    public String getWorkflowStatus() {
        return workflowStatus;
    }

    public void setWorkflowStatus(String workflowStatus) {
        this.workflowStatus = workflowStatus;
    }
}