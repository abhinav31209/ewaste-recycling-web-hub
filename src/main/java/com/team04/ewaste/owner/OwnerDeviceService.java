package com.team04.ewaste.owner;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.device.DeviceService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class OwnerDeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final DeviceService deviceService;

    public OwnerDeviceService(DeviceRepository deviceRepository,
                              UserRepository userRepository,
                              DeviceService deviceService) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.deviceService = deviceService;
    }

    public OwnerDeviceResponse submit(String email, OwnerDeviceSubmitRequest req){

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Device device = deviceService.createForOwner(
                owner.getId(),
                req.getDeviceName(),
                req.getBrand(),
                req.getCondition(),
                req.getDeviceType()
        );

        return toOwnerResponse(device);
    }

    public List<OwnerDeviceResponse> listMine(String email){

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        return deviceRepository.findByUserId(owner.getId())
                .stream()
                .map(this::toOwnerResponse)
                .toList();
    }

    public OwnerDeviceResponse getMineById(String email, @NonNull UUID deviceId){

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        if (!owner.getId().equals(device.getUserId())) {
            throw new ResponseStatusException(NOT_FOUND, "Device not found");
        }

        return toOwnerResponse(device);
    }

    private OwnerDeviceResponse toOwnerResponse(Device device) {
        return new OwnerDeviceResponse(
                device.getId(),
                device.getDeviceName(),
                device.getBrand(),
                device.getCondition(),
                device.getDeviceType(),
                device.getClassification(),
                device.getWorkflowStatus(),
                device.getDataWipeStatus(),
                device.getDataWipeCompletedAt(),
                device.getDataWipeCompletedBy(),
                device.getRetrievalAvailable(),
                device.getRetrievalAvailableAt(),
                device.getRetrievalAvailableUntil(),
                buildStatusLabel(device),
                buildResultMessage(device),
                device.getCreatedAt(),
                device.getUpdatedAt()
        );
    }

    private String buildStatusLabel(Device device) {
        switch (device.getWorkflowStatus()) {
            case SUBMITTED:
                return "Submitted";
            case PENDING_REVIEW:
            case UNDER_REVIEW:
                return "Under Review";
            case DATA_WIPE_PENDING:
            case RECYCLE_APPROVED:
                return "Waiting for Data Wipe Preparation";
            case DATA_WIPE_COMPLETED:
            case RETRIEVAL_AVAILABLE:
                return "Retrieval Available";
            case RETRIEVAL_REQUESTED:
                return "Payment Pending";
            case RETRIEVAL_PAID:
                return "Paid, Waiting for Fulfillment";
            case RETRIEVAL_FULFILLED:
                return "Secure Access Ready";
            case PUBLISHED:
                return "Processed";
            case HIDDEN:
                return "Needs Follow-up";
            default:
                return "Unknown";
        }
    }

    private String buildResultMessage(Device device) {
        switch (device.getWorkflowStatus()) {
            case SUBMITTED:
                return "Your device has been submitted and is waiting for staff review.";
            case PENDING_REVIEW:
            case UNDER_REVIEW:
                return "Our staff are currently reviewing your device details.";
            case DATA_WIPE_PENDING:
            case RECYCLE_APPROVED:
                return "Staff prepares free data wiping first. Once retrieval is available, you can request paid data retrieval before the deadline.";
            case DATA_WIPE_COMPLETED:
            case RETRIEVAL_AVAILABLE:
                return "The device is ready for paid data retrieval request within the current availability window.";
            case RETRIEVAL_REQUESTED:
                return "Your retrieval request is waiting for payment before staff can continue.";
            case RETRIEVAL_PAID:
                return "Payment is confirmed. Staff can now fulfill secure retrieval access.";
            case RETRIEVAL_FULFILLED:
                return "Secure retrieval access has been prepared for this device.";
            case PUBLISHED:
                return "Your device has been reviewed and classified as " + device.getClassification() + ".";
            case HIDDEN:
                return "Your device requires further staff action before results can be shown.";
            default:
                return "No result is currently available.";
        }
    }
}

