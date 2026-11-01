package com.team04.ewaste.referral;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReferralFeeRepository extends JpaRepository<ReferralFee, UUID> {

    List<ReferralFee> findByDeviceId(UUID deviceId);

    Optional<ReferralFee> findFirstByDeviceIdOrderByCreatedAtDesc(UUID deviceId);
}
