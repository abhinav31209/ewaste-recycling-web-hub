package com.team04.ewaste.device;

import com.team04.ewaste.device.dto.DeviceSubmitRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping
    public Device submit(@Valid @RequestBody DeviceSubmitRequest req) {
        return deviceService.submit(req);
    }

    @GetMapping
    public List<Device> myDevices(@RequestParam UUID userId) {
        return deviceService.listByUser(userId);
    }

}