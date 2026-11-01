package com.team04.ewaste.admin;

import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.device.dto.DeviceClassifyRequest;
import com.team04.ewaste.admin.dto.AdminDashboardResponse;
import com.team04.ewaste.admin.dto.DeviceProcessingReportResponse;

import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin")
public class AdminDeviceController {

    private final DeviceRepository deviceRepository;
    private final AdminDashboardService adminDashboardService;
    private final AdminReportService adminReportService;

    public AdminDeviceController(DeviceRepository deviceRepository,
                                 AdminDashboardService adminDashboardService,
                                 AdminReportService adminReportService) {
        this.deviceRepository = deviceRepository;
        this.adminDashboardService = adminDashboardService;
        this.adminReportService = adminReportService;
    }

    @GetMapping("/devices")
    public List<Device> getAllDevices() {
        return deviceRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @PutMapping("/device/{id}/classify")
    public Device classifyDevice(@PathVariable UUID id,
                                 @RequestBody DeviceClassifyRequest req) {

        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        DeviceClassification classification =
                DeviceClassification.valueOf(req.classification.toUpperCase());

        device.setClassification(classification);

        return deviceRepository.save(device);
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboardStats() {
        return adminDashboardService.getDashboardStats();
    }

    @GetMapping("/reports/device-processing")
    public DeviceProcessingReportResponse getDeviceProcessingReport() {
        return adminReportService.getDeviceProcessingReport();
    }
}