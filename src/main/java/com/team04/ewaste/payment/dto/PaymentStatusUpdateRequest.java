package com.team04.ewaste.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentStatusUpdateRequest(@NotBlank String status, String reason) {}
