package com.team04.ewaste.payment.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record PaymentRefundRequest(@DecimalMin("0.01") BigDecimal amount, String reason) {}
