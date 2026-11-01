package com.team04.ewaste.payment.dto;

import com.team04.ewaste.payment.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID userId,
        UUID orderId,
        String provider,
        String providerIntentId,
        String checkoutUrl,
        BigDecimal amount,
        BigDecimal refundedAmount,
        String currency,
        String status,
        String description,
        String failureReason,
        Map<String, Object> metadata,
        Instant createdAt,
        Instant updatedAt,
        Instant paidAt,
        Instant refundedAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getUserId(),
                payment.getOrderId(),
                payment.getProvider() == null ? null : payment.getProvider().toDb(),
                payment.getProviderIntentId(),
                payment.getCheckoutUrl(),
                payment.getAmount(),
                payment.getRefundedAmount(),
                payment.getCurrency(),
                payment.getStatus() == null ? null : payment.getStatus().toDb(),
                payment.getDescription(),
                payment.getFailureReason(),
                payment.getMetadata(),
                payment.getCreatedAt(),
                payment.getUpdatedAt(),
                payment.getPaidAt(),
                payment.getRefundedAt()
        );
    }
}
