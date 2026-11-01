package com.team04.ewaste.payment.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record PaymentQuoteResponse(
        UUID orderId,
        String item,
        BigDecimal amount,
        String currency,
        String explanation,
        Map<String, BigDecimal> priceBreakdown
) {}
