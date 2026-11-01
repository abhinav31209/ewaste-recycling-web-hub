package com.team04.ewaste.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record PaymentCreateRequest(
        @NotBlank String provider,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String currency,
        UUID orderId,
        String description,
        Boolean autoSucceed,
        String returnUrl,
        String cancelUrl,
        Map<String, Object> metadata
) {}
