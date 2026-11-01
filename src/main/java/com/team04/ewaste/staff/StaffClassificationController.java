package com.team04.ewaste.staff;

import com.team04.ewaste.staff.dto.ClassificationResultResponse;
import com.team04.ewaste.staff.dto.FollowUpUpdateRequest;
import com.team04.ewaste.staff.dto.DeviceDetailsUpdateRequest;
import com.team04.ewaste.staff.dto.DeviceVisibilityUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/devices")
public class StaffClassificationController {

    private final ClassificationResultService classificationResultService;

    public StaffClassificationController(ClassificationResultService classificationResultService) {
        this.classificationResultService = classificationResultService;
    }

    /**
     * Retrieve the classification result for a specific device.
     *
     * This endpoint determines the appropriate processing route based on the
     * device classification (CURRENT, RECYCLE, RARE, UNKNOWN) and returns
     * the corresponding workflow information.
     *
     * Example routes:
     * CURRENT  → Trade-in platform recommendation
     * RECYCLE  → Recycling flow
     * RARE     → Collector market suggestion
     * UNKNOWN  → Requires staff follow-up
     */

    @GetMapping("/{id}/classification-result")
    public ResponseEntity<ClassificationResultResponse> getClassificationResult(@PathVariable UUID id) {

        return ResponseEntity.ok(
                classificationResultService.getClassificationResult(id)
        );
    }
    /**
     * Update follow-up information for devices classified as UNKNOWN.
     *
     * Staff members can update the follow-up status, indicate whether the
     * device owner has been contacted, and leave notes regarding the case.
     *
     * This supports the manual handling workflow for devices that cannot
     * be automatically classified.
     */
    @PatchMapping("/{id}/follow-up")
    public ResponseEntity<String> updateFollowUp(
            @PathVariable UUID id,
            @RequestBody FollowUpUpdateRequest request) {

        classificationResultService.updateFollowUp(
                id,
                request.followUpStatus,
                request.ownerContacted,
                request.staffNote
        );

        return ResponseEntity.ok("Follow-up updated");
    }

    @PutMapping("/{id}/details")
    public ResponseEntity<String> updateDeviceDetails(
            @PathVariable UUID id,
            @RequestBody DeviceDetailsUpdateRequest request) {

        classificationResultService.updateDeviceDetails(
                id,
                request.deviceName,
                request.brand,
                request.condition,
                request.details,
                request.deviceType,
                request.staffNote
        );

        return ResponseEntity.ok("Device details updated");
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<String> updateDeviceVisibility(
            @PathVariable UUID id,
            @RequestBody DeviceVisibilityUpdateRequest request) {

        classificationResultService.updateDeviceVisibility(id, request.visibility);

        return ResponseEntity.ok("Device visibility updated");
    }
}