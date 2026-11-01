package com.team04.ewaste.referral;

import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.referral.dto.ReferralFeeResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReferralFeeService {

    private final ReferralFeeRepository referralFeeRepository;

    public ReferralFeeService(ReferralFeeRepository referralFeeRepository) {
        this.referralFeeRepository = referralFeeRepository;
    }

    @Transactional
    public ReferralFee createOrUpdateReferralForDevice(Device device) {

        if (device.getClassification() != DeviceClassification.CURRENT
                && device.getClassification() != DeviceClassification.RARE) {
            throw new IllegalStateException("Referral fee only applies to CURRENT or RARE devices");
        }

        ReferralFee referralFee = referralFeeRepository
                .findFirstByDeviceIdOrderByCreatedAtDesc(device.getId())
                .orElseGet(ReferralFee::new);

        String deviceName = safeDeviceName(device);
        String referralCode = referralFee.getReferralCode();

        if (referralCode == null || referralCode.isBlank()) {
            referralCode = generateReferralCode(device);
        }

        String thirdPartyName;
        BigDecimal estimatedFee;
        String referralUrl;

        if (device.getClassification() == DeviceClassification.CURRENT) {
            thirdPartyName = "CeX";
            estimatedFee = new BigDecimal("5.00");
            referralUrl = "https://uk.webuy.com/search?stext="
                    + encode(deviceName)
                    + "&ref="
                    + referralCode;
        } else {
            thirdPartyName = "eBay";
            estimatedFee = new BigDecimal("3.00");
            referralUrl = "https://www.ebay.co.uk/sch/i.html?_nkw="
                    + encode(deviceName)
                    + "&ref="
                    + referralCode;
        }

        referralFee.setDeviceId(device.getId());
        referralFee.setOwnerId(device.getUserId());
        referralFee.setDeviceName(deviceName);
        referralFee.setThirdPartyName(thirdPartyName);
        referralFee.setReferralCode(referralCode);
        referralFee.setReferralUrl(referralUrl);
        referralFee.setEstimatedFee(estimatedFee);

        if (referralFee.getStatus() == null) {
            referralFee.setStatus(ReferralFeeStatus.PENDING);
        }

        return referralFeeRepository.save(referralFee);
    }

    @Transactional(readOnly = true)
    public List<ReferralFeeResponse> getAllReferralFees() {
        return referralFeeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReferralFeeResponse> getReferralFeesByDevice(UUID deviceId) {
        return referralFeeRepository.findByDeviceId(deviceId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReferralFee getLatestReferralByDevice(UUID deviceId) {
        return referralFeeRepository.findFirstByDeviceIdOrderByCreatedAtDesc(deviceId)
                .orElse(null);
    }

    @Transactional
    public ReferralFeeResponse updateStatus(UUID referralId, ReferralFeeStatus status) {
        ReferralFee referralFee = referralFeeRepository.findById(referralId)
                .orElseThrow(() -> new RuntimeException("Referral fee not found"));

        referralFee.setStatus(status);

        if (status == ReferralFeeStatus.CONFIRMED) {
            referralFee.setConfirmedAt(Instant.now());
        }

        if (status == ReferralFeeStatus.PAID) {
            referralFee.setPaidAt(Instant.now());
        }

        return toResponse(referralFeeRepository.save(referralFee));
    }

    private ReferralFeeResponse toResponse(ReferralFee r) {
        return new ReferralFeeResponse(
                r.getId(),
                r.getDeviceId(),
                r.getOwnerId(),
                r.getDeviceName(),
                r.getThirdPartyName(),
                r.getReferralCode(),
                r.getReferralUrl(),
                r.getEstimatedFee(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getConfirmedAt(),
                r.getPaidAt()
        );
    }

    private String generateReferralCode(Device device) {
        return "EWASTE-"
                + device.getId().toString().substring(0, 8).toUpperCase()
                + "-"
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String safeDeviceName(Device device) {
        if (device.getDeviceName() != null && !device.getDeviceName().isBlank()) {
            return device.getDeviceName();
        }
        return "device";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}