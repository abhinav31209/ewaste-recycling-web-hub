package com.team04.ewaste.admin;

import com.team04.ewaste.admin.dto.AdminDashboardResponse;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.device.*;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;

    public AdminDashboardService(UserRepository userRepository,
                                 DeviceRepository deviceRepository) {
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
    }

    public AdminDashboardResponse getDashboardStats() {

        AdminDashboardResponse res = new AdminDashboardResponse();

        // Users
        res.totalUsers = userRepository.count();
        res.activeUsers = userRepository.countByStatus("active");
        res.disabledUsers = userRepository.countByStatus("disabled");

        // Device classification
        res.totalDevices = deviceRepository.count();
        res.currentDevices = deviceRepository.countByClassification(DeviceClassification.CURRENT);
        res.recycleDevices = deviceRepository.countByClassification(DeviceClassification.RECYCLE);
        res.rareDevices = deviceRepository.countByClassification(DeviceClassification.RARE);
        res.unknownDevices = deviceRepository.countByClassification(DeviceClassification.UNKNOWN);

        // Workflow status
        res.submittedDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.SUBMITTED);
        res.underReviewDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.UNDER_REVIEW);
        res.publishedDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.PUBLISHED);
        res.hiddenDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.HIDDEN);

        // Visibility
        res.draftDevices = deviceRepository.countByVisibility(DeviceVisibility.DRAFT);
        res.visibleDevices = deviceRepository.countByVisibility(DeviceVisibility.VISIBLE);
        res.hiddenVisibilityDevices = deviceRepository.countByVisibility(DeviceVisibility.HIDDEN);

        return res;
    }
}