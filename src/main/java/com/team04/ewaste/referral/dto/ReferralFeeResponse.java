package com.team04.ewaste.referral.dto;

import com.team04.ewaste.referral.ReferralFeeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReferralFeeResponse(
        UUID id,
        UUID deviceId,
        UUID ownerId,
        String deviceName,
        String thirdPartyName,
        String referralCode,
        String referralUrl,
        BigDecimal estimatedFee,
        ReferralFeeStatus status,
        Instant createdAt,
        Instant confirmedAt,
        Instant paidAt
) {
}
