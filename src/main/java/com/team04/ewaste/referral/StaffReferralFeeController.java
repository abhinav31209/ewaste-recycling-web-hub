package com.team04.ewaste.referral;

import com.team04.ewaste.referral.dto.ReferralFeeResponse;
import com.team04.ewaste.referral.dto.ReferralFeeStatusUpdateRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/reports/referral-fees")
public class StaffReferralFeeController {

    private final ReferralFeeService referralFeeService;

    public StaffReferralFeeController(ReferralFeeService referralFeeService) {
        this.referralFeeService = referralFeeService;
    }

    @GetMapping
    public List<ReferralFeeResponse> getReferralFeeReport() {
        return referralFeeService.getAllReferralFees();
    }

    @GetMapping("/device/{deviceId}")
    public List<ReferralFeeResponse> getReferralFeesByDevice(@PathVariable UUID deviceId) {
        return referralFeeService.getReferralFeesByDevice(deviceId);
    }

    @PatchMapping("/{referralId}/status")
    public ReferralFeeResponse updateStatus(
            @PathVariable UUID referralId,
            @RequestBody ReferralFeeStatusUpdateRequest request
    ) {
        return referralFeeService.updateStatus(referralId, request.status());
    }
}