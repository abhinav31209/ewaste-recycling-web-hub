package com.team04.ewaste.staff;

import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceWorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StaffDeviceRepository extends JpaRepository<Device, UUID> {

    List<Device> findByUserId(UUID userId);

    List<Device> findByClassification(DeviceClassification classification);

    List<Device> findByWorkflowStatus(DeviceWorkflowStatus workflowStatus);

    List<Device> findByWorkflowStatusIn(Collection<DeviceWorkflowStatus> workflowStatuses);

}
