package com.team04.ewaste.staff;

import com.team04.ewaste.staff.dto.DeviceResponse;
import com.team04.ewaste.staff.dto.ReclassifyRequest;
import com.team04.ewaste.staff.dto.StaffUpdateDeviceRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/devices")
public class StaffDeviceController {

    private final StaffDeviceService staffDeviceService;

    public StaffDeviceController(StaffDeviceService staffDeviceService) {
        this.staffDeviceService = staffDeviceService;
    }

    @GetMapping("/unknown")
    public ResponseEntity<List<DeviceResponse>> unknownQueue() {
        return ResponseEntity.ok(staffDeviceService.listUnknownQueue());
    }

    @GetMapping("/hidden")
    public ResponseEntity<List<DeviceResponse>> hiddenDrafts() {
        return ResponseEntity.ok(staffDeviceService.listHiddenDrafts());
    }

    @GetMapping("/recycle-processing")
    public ResponseEntity<List<DeviceResponse>> recycleProcessingQueue() {
        return ResponseEntity.ok(staffDeviceService.listRecycleProcessingQueue());
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeviceResponse> update(
            @PathVariable @NonNull UUID id,
            @RequestBody StaffUpdateDeviceRequest req
    ) {
        return ResponseEntity.ok(staffDeviceService.updateDevice(id, req));
    }

    @PostMapping("/{id}/reclassify")
    public ResponseEntity<DeviceResponse> reclassify(
            @PathVariable @NonNull UUID id,
            @RequestBody ReclassifyRequest req
    ) {
        return ResponseEntity.ok(staffDeviceService.reclassify(id, req));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<DeviceResponse> publish(@PathVariable @NonNull UUID id) {
        return ResponseEntity.ok(staffDeviceService.publish(id));
    }

    @PostMapping("/{id}/hide")
    public ResponseEntity<DeviceResponse> hide(@PathVariable @NonNull UUID id) {
        return ResponseEntity.ok(staffDeviceService.hide(id));
    }

    @PostMapping("/{id}/data-wipe/complete")
    public ResponseEntity<DeviceResponse> markDataWipeComplete(
            @PathVariable @NonNull UUID id,
            Authentication auth
    ) {
        return ResponseEntity.ok(staffDeviceService.markDataWipeComplete(id, auth.getName()));
    }
}
