package com.team04.ewaste.payment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.team04.ewaste.auth.User;
import com.team04.ewaste.staff.Order;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    @Column(name = "order_id")
    private UUID orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    @JsonIgnore
    private Order order;

    @Convert(converter = PaymentProviderConverter.class)
    @Column(nullable = false, columnDefinition = "text")
    private PaymentProvider provider;

    @Column(name = "provider_intent_id")
    private String providerIntentId;

    @Column(name = "checkout_url")
    private String checkoutUrl;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "refunded_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "GBP";

    @Convert(converter = PaymentStatusConverter.class)
    @Column(nullable = false, columnDefinition = "text")
    private PaymentStatus status = PaymentStatus.INITIATED;

    private String description;

    @Column(name = "failure_reason")
    private String failureReason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata = new LinkedHashMap<>();

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (currency == null || currency.isBlank()) currency = "GBP";
        if (refundedAmount == null) refundedAmount = BigDecimal.ZERO;
        if (metadata == null) metadata = new LinkedHashMap<>();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        if (refundedAmount == null) refundedAmount = BigDecimal.ZERO;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getOrderId() { return orderId; }
    public PaymentProvider getProvider() { return provider; }
    public String getProviderIntentId() { return providerIntentId; }
    public String getCheckoutUrl() { return checkoutUrl; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getRefundedAmount() { return refundedAmount; }
    public String getCurrency() { return currency; }
    public PaymentStatus getStatus() { return status; }
    public String getDescription() { return description; }
    public String getFailureReason() { return failureReason; }
    public Map<String, Object> getMetadata() { return metadata; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getPaidAt() { return paidAt; }
    public Instant getRefundedAt() { return refundedAt; }

    public void setUserId(UUID userId) { this.userId = userId; }
    public void setOrderId(UUID orderId) { this.orderId = orderId; }
    public void setProvider(PaymentProvider provider) { this.provider = provider; }
    public void setProviderIntentId(String providerIntentId) { this.providerIntentId = providerIntentId; }
    public void setCheckoutUrl(String checkoutUrl) { this.checkoutUrl = checkoutUrl; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setRefundedAmount(BigDecimal refundedAmount) { this.refundedAmount = refundedAmount; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public void setDescription(String description) { this.description = description; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public void setRefundedAt(Instant refundedAt) { this.refundedAt = refundedAt; }
}
