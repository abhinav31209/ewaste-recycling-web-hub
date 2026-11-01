package com.team04.ewaste.device;

import com.team04.ewaste.device.dto.DeviceSubmitRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public Device submit(DeviceSubmitRequest req) {

        Device d = new Device();

        d.setUserId(req.getUserId());
        d.setDeviceName(req.getDeviceName());
        d.setBrand(req.getBrand());
        d.setCondition(req.getCondition());

        d.setClassification(DeviceClassification.UNKNOWN);
        d.setWorkflowStatus(DeviceWorkflowStatus.SUBMITTED);
        d.setDataWipeStatus(DeviceDataWipeStatus.NOT_REQUIRED);
        d.setRetrievalAvailable(false);

        return deviceRepository.save(d);
    }

    public List<Device> listByUser(UUID userId) {
        return deviceRepository.findByUserId(userId);
    }

    public Device createForOwner(UUID ownerId, String deviceName, String brand, String condition, DeviceType deviceType) {

        Device d = new Device();

        d.setUserId(ownerId);
        d.setDeviceName(deviceName);
        d.setBrand(brand);
        d.setCondition(condition);
        d.setDeviceType(deviceType);

        d.setClassification(DeviceClassification.UNKNOWN);
        d.setWorkflowStatus(DeviceWorkflowStatus.SUBMITTED);
        d.setDataWipeStatus(DeviceDataWipeStatus.NOT_REQUIRED);
        d.setRetrievalAvailable(false);

        return deviceRepository.save(d);
    }
}
