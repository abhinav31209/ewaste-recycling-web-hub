package com.team04.ewaste.staff;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.team04.ewaste.auth.User;
import com.team04.ewaste.device.Device;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User owner;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", insertable = false, updatable = false)
    @JsonIgnore
    private Device device;

    @Enumerated(EnumType.STRING)
    private OrderType type;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PAYMENT_PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private OrderPaymentStatus paymentStatus = OrderPaymentStatus.UNPAID;

    private Instant createdAt = Instant.now();

    private Instant paidAt;

    @Column(name = "payment_id")
    private UUID paymentId;

    private String retrievalToken;

    private Instant fulfilledAt;

    private Instant expiresAt;

    private boolean hardDeleted = false;

    public Order() {}

    public Order(UUID userId, UUID deviceId, OrderType type) {
        this.userId = userId;
        this.deviceId = deviceId;
        this.type = type;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getDeviceId() { return deviceId; }

    public OrderType getType() { return type; }
    public OrderStatus getStatus() { return status; }
    public OrderPaymentStatus getPaymentStatus() { return paymentStatus; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getPaidAt() { return paidAt; }
    public UUID getPaymentId() { return paymentId; }
    public String getRetrievalToken() { return retrievalToken; }
    public Instant getFulfilledAt() { return fulfilledAt; }
    public Instant getExpiresAt() { return expiresAt; }

    public boolean isHardDeleted() { return hardDeleted; }

    public void setStatus(OrderStatus status) { this.status = status; }
    public void setPaymentStatus(OrderPaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public void setRetrievalToken(String retrievalToken) { this.retrievalToken = retrievalToken; }
    public void setFulfilledAt(Instant fulfilledAt) { this.fulfilledAt = fulfilledAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public void setHardDeleted(boolean hardDeleted) { this.hardDeleted = hardDeleted; }
}
