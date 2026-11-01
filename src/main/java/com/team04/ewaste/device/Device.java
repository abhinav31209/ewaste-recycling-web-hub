package com.team04.ewaste.device;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.team04.ewaste.auth.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "devices")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User owner;

    @Column(name = "device_name", nullable = false)
    private String deviceName;

    @Column(name = "brand")
    private String brand;

    @Column(name = "condition")
    private String condition;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification")
    private DeviceClassification classification = DeviceClassification.UNKNOWN;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_status")
    private DeviceWorkflowStatus workflowStatus = DeviceWorkflowStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_wipe_status")
    private DeviceDataWipeStatus dataWipeStatus = DeviceDataWipeStatus.NOT_REQUIRED;

    @Column(name = "data_wipe_completed_at")
    private Instant dataWipeCompletedAt;

    @Column(name = "data_wipe_completed_by")
    private UUID dataWipeCompletedBy;

    @Column(name = "retrieval_available")
    private Boolean retrievalAvailable = false;

    @Column(name = "retrieval_available_at")
    private Instant retrievalAvailableAt;

    @Column(name = "retrieval_available_until")
    private Instant retrievalAvailableUntil;

    @Column(name = "follow_up_status")
    private String followUpStatus;

    @Column(name = "owner_contacted")
    private Boolean ownerContacted = false;

    @Column(name = "staff_note")
    private String staffNote;

    @Column(name = "details", length = 1000)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type")
    private DeviceType deviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_visibility")
    private DeviceVisibility visibility = DeviceVisibility.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Device() {}

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getDeviceName() { return deviceName; }
    public String getBrand() { return brand; }
    public String getCondition() { return condition; }
    public DeviceClassification getClassification() { return classification; }
    public DeviceWorkflowStatus getWorkflowStatus() { return workflowStatus; }
    public String getFollowUpStatus() { return followUpStatus; }
    public Boolean getOwnerContacted() { return ownerContacted; }
    public String getStaffNote() { return staffNote; }
    public String getDetails() { return details; }
    public DeviceType getDeviceType() { return deviceType; }
    public DeviceVisibility getVisibility() { return visibility; }
    public DeviceDataWipeStatus getDataWipeStatus() { return dataWipeStatus; }
    public Instant getDataWipeCompletedAt() { return dataWipeCompletedAt; }
    public UUID getDataWipeCompletedBy() { return dataWipeCompletedBy; }
    public Boolean getRetrievalAvailable() { return retrievalAvailable; }
    public Instant getRetrievalAvailableAt() { return retrievalAvailableAt; }
    public Instant getRetrievalAvailableUntil() { return retrievalAvailableUntil; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setUserId(UUID userId) { this.userId = userId; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setCondition(String condition) { this.condition = condition; }
    public void setClassification(DeviceClassification classification) { this.classification = classification; }
    public void setWorkflowStatus(DeviceWorkflowStatus workflowStatus) { this.workflowStatus = workflowStatus; }
    public void setFollowUpStatus(String followUpStatus) { this.followUpStatus = followUpStatus; }
    public void setOwnerContacted(Boolean ownerContacted) { this.ownerContacted = ownerContacted; }
    public void setStaffNote(String staffNote) { this.staffNote = staffNote; }
    public void setDetails(String details) { this.details = details; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }
    public void setVisibility(DeviceVisibility visibility) { this.visibility = visibility; }
    public void setDataWipeStatus(DeviceDataWipeStatus dataWipeStatus) { this.dataWipeStatus = dataWipeStatus; }
    public void setDataWipeCompletedAt(Instant dataWipeCompletedAt) { this.dataWipeCompletedAt = dataWipeCompletedAt; }
    public void setDataWipeCompletedBy(UUID dataWipeCompletedBy) { this.dataWipeCompletedBy = dataWipeCompletedBy; }
    public void setRetrievalAvailable(Boolean retrievalAvailable) { this.retrievalAvailable = retrievalAvailable; }
    public void setRetrievalAvailableAt(Instant retrievalAvailableAt) { this.retrievalAvailableAt = retrievalAvailableAt; }
    public void setRetrievalAvailableUntil(Instant retrievalAvailableUntil) { this.retrievalAvailableUntil = retrievalAvailableUntil; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
