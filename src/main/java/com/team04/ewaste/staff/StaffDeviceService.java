package com.team04.ewaste.staff;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceDataWipeStatus;
import com.team04.ewaste.device.DeviceWorkflowStatus;
import com.team04.ewaste.staff.dto.DeviceResponse;
import com.team04.ewaste.staff.dto.ReclassifyRequest;
import com.team04.ewaste.staff.dto.StaffUpdateDeviceRequest;
import com.team04.ewaste.referral.ReferralFeeService;
import jakarta.transaction.Transactional;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class StaffDeviceService {

    private final StaffDeviceRepository staffDeviceRepository;
    private final ReferralFeeService referralFeeService;
    private final UserRepository userRepository;

    public StaffDeviceService(
            StaffDeviceRepository staffDeviceRepository,
            ReferralFeeService referralFeeService,
            UserRepository userRepository
    ) {
        this.staffDeviceRepository = staffDeviceRepository;
        this.referralFeeService = referralFeeService;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<DeviceResponse> listUnknownQueue() {

        return staffDeviceRepository
                .findByWorkflowStatusIn(EnumSet.of(
                        DeviceWorkflowStatus.SUBMITTED,
                        DeviceWorkflowStatus.UNDER_REVIEW
                ))
                .stream()
                .map(this::toStaffResponse)
                .toList();
    }

    @Transactional
    public List<DeviceResponse> listRecycleProcessingQueue() {

        return staffDeviceRepository
                .findByClassification(DeviceClassification.RECYCLE)
                .stream()
                .filter(device -> device.getWorkflowStatus() == DeviceWorkflowStatus.DATA_WIPE_PENDING
                        || device.getWorkflowStatus() == DeviceWorkflowStatus.RETRIEVAL_AVAILABLE
                        || device.getWorkflowStatus() == DeviceWorkflowStatus.RETRIEVAL_REQUESTED
                        || device.getWorkflowStatus() == DeviceWorkflowStatus.RETRIEVAL_PAID
                        || device.getWorkflowStatus() == DeviceWorkflowStatus.RETRIEVAL_FULFILLED)
                .map(this::toStaffResponse)
                .toList();
    }

    @Transactional
    public List<DeviceResponse> listHiddenDrafts() {

        return staffDeviceRepository
                .findByWorkflowStatus(DeviceWorkflowStatus.HIDDEN)
                .stream()
                .map(this::toStaffResponse)
                .toList();
    }

    @Transactional
    public DeviceResponse updateDevice(@NonNull UUID deviceId, StaffUpdateDeviceRequest req) {

        Device d = staffDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        if (d.getWorkflowStatus() == DeviceWorkflowStatus.SUBMITTED) {
            d.setWorkflowStatus(DeviceWorkflowStatus.UNDER_REVIEW);
        }

        if (req.deviceName != null) d.setDeviceName(req.deviceName);
        if (req.brand != null) d.setBrand(req.brand);
        if (req.condition != null) d.setCondition(req.condition);
        if (req.deviceType != null) d.setDeviceType(req.deviceType);

        return toStaffResponse(d);
    }

    @Transactional
    public DeviceResponse reclassify(@NonNull UUID deviceId, ReclassifyRequest req) {

        Device d = staffDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        d.setClassification(req.classification);

        if (d.getClassification() == DeviceClassification.CURRENT
                || d.getClassification() == DeviceClassification.RARE) {
            referralFeeService.createOrUpdateReferralForDevice(d);
        }

        return toStaffResponse(d);
    }

    @Transactional
    public DeviceResponse publish(@NonNull UUID deviceId) {

        Device d = staffDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        if (d.getClassification() == DeviceClassification.UNKNOWN) {
            throw new ResponseStatusException(BAD_REQUEST, "Device must be classified before publishing");
        }

        if (d.getClassification() == DeviceClassification.RECYCLE) {
            d.setWorkflowStatus(DeviceWorkflowStatus.DATA_WIPE_PENDING);
            d.setDataWipeStatus(DeviceDataWipeStatus.PENDING);
            d.setRetrievalAvailable(false);
            d.setRetrievalAvailableAt(null);
            d.setRetrievalAvailableUntil(null);
            d.setDataWipeCompletedAt(null);
            d.setDataWipeCompletedBy(null);
        } else {
            d.setWorkflowStatus(DeviceWorkflowStatus.PUBLISHED);
            d.setDataWipeStatus(DeviceDataWipeStatus.NOT_REQUIRED);
            d.setRetrievalAvailable(false);
            d.setRetrievalAvailableAt(null);
            d.setRetrievalAvailableUntil(null);
            d.setDataWipeCompletedAt(null);
            d.setDataWipeCompletedBy(null);
        }

        return toStaffResponse(d);
    }

    @Transactional
    public DeviceResponse hide(@NonNull UUID deviceId) {

        Device d = staffDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        d.setWorkflowStatus(DeviceWorkflowStatus.HIDDEN);

        return toStaffResponse(d);
    }

    @Transactional
    public DeviceResponse markDataWipeComplete(@NonNull UUID deviceId, @NonNull String staffEmail) {

        Device d = staffDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        if (d.getClassification() != DeviceClassification.RECYCLE) {
            throw new ResponseStatusException(BAD_REQUEST, "Only RECYCLE devices can be marked retrieval available");
        }

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Staff user not found"));

        Instant now = Instant.now();

        d.setDataWipeStatus(DeviceDataWipeStatus.COMPLETED);
        d.setDataWipeCompletedAt(now);
        d.setDataWipeCompletedBy(staff.getId());
        d.setRetrievalAvailable(true);
        d.setRetrievalAvailableAt(now);
        d.setRetrievalAvailableUntil(plusMonths(now, 3));
        d.setWorkflowStatus(DeviceWorkflowStatus.RETRIEVAL_AVAILABLE);

        return toStaffResponse(d);
    }

    private DeviceResponse toStaffResponse(Device d) {

        return new DeviceResponse(
                d.getId(),
                d.getUserId(),
                d.getDeviceName(),
                d.getBrand(),
                d.getCondition(),
                d.getDeviceType(),
                d.getClassification(),
                d.getWorkflowStatus(),
                d.getDataWipeStatus(),
                d.getDataWipeCompletedAt(),
                d.getDataWipeCompletedBy(),
                d.getRetrievalAvailable(),
                d.getRetrievalAvailableAt(),
                d.getRetrievalAvailableUntil(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    private Instant plusMonths(Instant base, int months) {
        return ZonedDateTime.ofInstant(base, ZoneOffset.UTC).plusMonths(months).toInstant();
    }
}

