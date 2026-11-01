package com.team04.ewaste.staff.dto;

import com.team04.ewaste.device.DeviceType;
import jakarta.validation.constraints.Size;

public class StaffUpdateDeviceRequest {

    @Size(max = 100)
    public String deviceName;

    @Size(max = 50)
    public String brand;

    @Size(max = 30)
    public String condition;

    public DeviceType deviceType;
}