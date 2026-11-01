package com.team04.ewaste.staff.dto;

import com.team04.ewaste.device.DeviceClassification;
import jakarta.validation.constraints.NotNull;

public class ReclassifyRequest {

    @NotNull
    public DeviceClassification classification;

}