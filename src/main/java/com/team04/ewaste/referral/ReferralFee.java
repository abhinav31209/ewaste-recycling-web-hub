package com.team04.ewaste.referral;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "referral_fees")
@Getter
@Setter
public class ReferralFee {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String deviceName;

    @Column(nullable = false)
    private String thirdPartyName;

    @Column(nullable = false, unique = true)
    private String referralCode;

    @Column(nullable = false, length = 1000)
    private String referralUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferralFeeStatus status = ReferralFeeStatus.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant confirmedAt;

    private Instant paidAt;
}