package com.team04.ewaste.device;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {

    List<Device> findByUserId(UUID userId);
    List<Device> findByClassification(DeviceClassification classification);
    List<Device> findByClassificationAndDataWipeStatus(DeviceClassification classification, DeviceDataWipeStatus dataWipeStatus);
    List<Device> findByRetrievalAvailableTrue();

    long countByClassification(DeviceClassification classification);

    long countByWorkflowStatus(DeviceWorkflowStatus workflowStatus);

    long countByVisibility(DeviceVisibility visibility);

}
