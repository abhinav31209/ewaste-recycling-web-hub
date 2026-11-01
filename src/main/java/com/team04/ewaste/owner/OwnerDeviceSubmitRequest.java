package com.team04.ewaste.owner;

import com.team04.ewaste.device.DeviceType;
import jakarta.validation.constraints.NotBlank;

public class OwnerDeviceSubmitRequest {

 private String brand;

 private String condition;

 @NotBlank
 private String deviceName;

 private DeviceType deviceType;

 public String getBrand() { return brand; }

 public String getCondition() { return condition; }

 public String getDeviceName() { return deviceName; }

 public DeviceType getDeviceType() { return deviceType; }

 public void setBrand(String brand) { this.brand = brand; }

 public void setCondition(String condition) { this.condition = condition; }

 public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

 public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }
}