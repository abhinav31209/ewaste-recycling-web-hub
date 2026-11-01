package com.team04.ewaste.staff;

import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.staff.dto.ClassificationResultResponse;
import org.springframework.stereotype.Service;
import com.team04.ewaste.device.DeviceType;
import com.team04.ewaste.device.DeviceVisibility;
import com.team04.ewaste.referral.ReferralFee;
import com.team04.ewaste.referral.ReferralFeeService;

import java.util.UUID;

@Service
public class ClassificationResultService {

    private final DeviceRepository deviceRepository;
    private final ReferralFeeService referralFeeService;

    public ClassificationResultService(
            DeviceRepository deviceRepository,
            ReferralFeeService referralFeeService
    ) {
        this.deviceRepository = deviceRepository;
        this.referralFeeService = referralFeeService;
    }

    public ClassificationResultResponse getClassificationResult(UUID deviceId) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        ClassificationResultResponse response = new ClassificationResultResponse();

        response.classification = device.getClassification().name();

        response.deviceType = device.getDeviceType() != null ? device.getDeviceType().name() : null;
        response.details = device.getDetails();
        response.visibility = device.getVisibility() != null ? device.getVisibility().name() : null;
        response.workflowStatus = device.getWorkflowStatus() != null ? device.getWorkflowStatus().name() : null;


        // CURRENT → Trade-in flow
        if (device.getClassification() == DeviceClassification.CURRENT) {
            response.route = "current";
            response.message = "Device eligible for trade-in";

            response.platform = "CeX";
            response.estimatedValue = "£120";

            ReferralFee referralFee = referralFeeService.getLatestReferralByDevice(device.getId());

            if (referralFee == null) {
                referralFee = referralFeeService.createOrUpdateReferralForDevice(device);
            }

            response.listingUrl = referralFee.getReferralUrl();
            response.referralCode = referralFee.getReferralCode();

            response.qrToken = referralFee.getReferralCode();
            response.voucherCode = "VOUCHER-" + referralFee.getReferralCode().substring(7, 15);
        }

        // RECYCLE → Recycling flow
        else if (device.getClassification() == DeviceClassification.RECYCLE) {
            response.route = "recycle";
            response.message = "Device should proceed to recycling flow";

            response.platform = "Local recycling";
        }

        // RARE → Collector market
        else if (device.getClassification() == DeviceClassification.RARE) {
            response.route = "rare";
            response.message = "Device may have collector value";

            response.platform = "eBay";
            ReferralFee referralFee = referralFeeService.getLatestReferralByDevice(device.getId());

            if (referralFee == null) {
                referralFee = referralFeeService.createOrUpdateReferralForDevice(device);
            }

            response.listingUrl = referralFee.getReferralUrl();
            response.referralCode = referralFee.getReferralCode();
        }

        // UNKNOWN → Staff follow-up
        else {
            response.route = "unknown";
            response.message = "More device information required";

            response.followUpStatus = device.getFollowUpStatus();
            response.ownerContacted = device.getOwnerContacted();
            response.staffNote = device.getStaffNote();
        }

        return response;
    }

    public void updateFollowUp(UUID deviceId, String followUpStatus, Boolean ownerContacted, String staffNote) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (followUpStatus != null) {
            device.setFollowUpStatus(followUpStatus);
        }
        if (ownerContacted != null) {
            device.setOwnerContacted(ownerContacted);
        }
        if (staffNote != null) {
            device.setStaffNote(staffNote);
        }

        deviceRepository.save(device);
    }

    public void updateDeviceDetails(
            UUID deviceId,
            String deviceName,
            String brand,
            String condition,
            String details,
            DeviceType deviceType,
            String staffNote) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (deviceName != null) {
            device.setDeviceName(deviceName);
        }

        if (brand != null) {
            device.setBrand(brand);
        }

        if (condition != null) {
            device.setCondition(condition);
        }

        if (details != null) {
            device.setDetails(details);
        }

        if (deviceType != null) {
            device.setDeviceType(deviceType);
        }

        if (staffNote != null) {
            device.setStaffNote(staffNote);
        }

        deviceRepository.save(device);
    }

    public void updateDeviceVisibility(UUID deviceId, DeviceVisibility visibility) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setVisibility(visibility);

        deviceRepository.save(device);
    }
}