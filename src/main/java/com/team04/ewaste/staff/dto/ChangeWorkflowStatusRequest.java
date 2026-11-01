package com.team04.ewaste.staff.dto;

import com.team04.ewaste.device.DeviceWorkflowStatus;
import jakarta.validation.constraints.NotNull;

public class ChangeWorkflowStatusRequest {

    @NotNull
    public DeviceWorkflowStatus workflowStatus;

}