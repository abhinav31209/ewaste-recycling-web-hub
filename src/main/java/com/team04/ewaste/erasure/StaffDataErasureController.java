package com.team04.ewaste.erasure;

import com.team04.ewaste.erasure.dto.DataErasureResponse;
import com.team04.ewaste.erasure.dto.DataErasureStatusUpdateRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/devices/{deviceId}/data-erasure")
public class StaffDataErasureController {

    private final DataErasureService dataErasureService;

    public StaffDataErasureController(DataErasureService dataErasureService) {
        this.dataErasureService = dataErasureService;
    }

    @PostMapping
    public DataErasureResponse createErasureRecord(@PathVariable UUID deviceId) {
        return dataErasureService.createErasureRecord(deviceId);
    }

    @GetMapping
    public DataErasureResponse getErasureRecord(@PathVariable UUID deviceId) {
        return dataErasureService.getErasureRecord(deviceId);
    }

    @PatchMapping("/status")
    public DataErasureResponse updateStatus(
            @PathVariable UUID deviceId,
            @RequestBody DataErasureStatusUpdateRequest request,
            Authentication auth
    ) {
        return dataErasureService.updateStatus(
                deviceId,
                request.status(),
                request.certificateCode(),
                request.staffNote(),
                auth.getName()
        );
    }
}
