package com.team04.ewaste.erasure;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceDataWipeStatus;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.device.DeviceWorkflowStatus;
import com.team04.ewaste.erasure.dto.DataErasureResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DataErasureService {

    private final DataErasureRepository dataErasureRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    public DataErasureService(
            DataErasureRepository dataErasureRepository,
            DeviceRepository deviceRepository,
            UserRepository userRepository
    ) {
        this.dataErasureRepository = dataErasureRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DataErasureResponse createErasureRecord(UUID deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        DataErasureRecord record = dataErasureRepository
                .findFirstByDeviceIdOrderByRequestedAtDesc(deviceId)
                .orElseGet(DataErasureRecord::new);

        record.setDeviceId(device.getId());
        record.setOwnerId(device.getUserId());

        if (record.getStatus() == null) {
            record.setStatus(DataErasureStatus.REQUESTED);
        }

        if (record.getErasureProvider() == null || record.getErasureProvider().isBlank()) {
            record.setErasureProvider("Third-party recycler");
        }

        return toResponse(dataErasureRepository.save(record));
    }

    @Transactional(readOnly = true)
    public DataErasureResponse getErasureRecord(UUID deviceId) {
        DataErasureRecord record = dataErasureRepository
                .findFirstByDeviceIdOrderByRequestedAtDesc(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Data erasure record not found"));

        return toResponse(record);
    }

    @Transactional
    public DataErasureResponse updateStatus(
            UUID deviceId,
            DataErasureStatus status,
            String certificateCode,
            String staffNote,
            String staffEmail
    ) {
        DataErasureRecord record = dataErasureRepository
                .findFirstByDeviceIdOrderByRequestedAtDesc(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Data erasure record not found"));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Staff user not found"));

        if (status != null) {
            validateStatusChange(device, status);
            record.setStatus(status);
        }

        if (certificateCode != null) {
            record.setCertificateCode(certificateCode);
        }

        if (staffNote != null) {
            record.setStaffNote(staffNote);
        }

        if (status == DataErasureStatus.COMPLETED) {
            Instant now = Instant.now();
            record.setCompletedAt(now);

            if (record.getCertificateCode() == null || record.getCertificateCode().isBlank()) {
                record.setCertificateCode(generateCertificateCode(record));
            }

            device.setDataWipeStatus(DeviceDataWipeStatus.COMPLETED);
            device.setDataWipeCompletedAt(now);
            device.setDataWipeCompletedBy(staff.getId());
            device.setRetrievalAvailable(true);
            device.setRetrievalAvailableAt(now);
            device.setRetrievalAvailableUntil(plusMonths(now, 3));
            device.setWorkflowStatus(DeviceWorkflowStatus.RETRIEVAL_AVAILABLE);
        } else if (status == DataErasureStatus.REQUESTED || status == DataErasureStatus.IN_PROGRESS) {
            device.setDataWipeStatus(DeviceDataWipeStatus.PENDING);
            if (device.getWorkflowStatus() == DeviceWorkflowStatus.RETRIEVAL_AVAILABLE) {
                device.setWorkflowStatus(DeviceWorkflowStatus.DATA_WIPE_PENDING);
            }
        }

        deviceRepository.save(device);
        return toResponse(dataErasureRepository.save(record));
    }

    private void validateStatusChange(Device device, DataErasureStatus status) {
        if (status == DataErasureStatus.COMPLETED && device.getClassification() != DeviceClassification.RECYCLE) {
            throw new ResponseStatusException(BAD_REQUEST, "Only RECYCLE devices can be marked retrieval available");
        }
    }

    private DataErasureResponse toResponse(DataErasureRecord record) {
        return new DataErasureResponse(
                record.getId(),
                record.getDeviceId(),
                record.getOwnerId(),
                record.getStatus(),
                record.getErasureProvider(),
                record.getCertificateCode(),
                record.getStaffNote(),
                record.getRequestedAt(),
                record.getCompletedAt()
        );
    }

    private String generateCertificateCode(DataErasureRecord record) {
        return "ERASURE-" + record.getDeviceId().toString().substring(0, 8).toUpperCase();
    }

    private Instant plusMonths(Instant base, int months) {
        return ZonedDateTime.ofInstant(base, ZoneOffset.UTC).plusMonths(months).toInstant();
    }
}
