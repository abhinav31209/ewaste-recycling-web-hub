package com.team04.ewaste.owner;

import com.team04.ewaste.staff.OrderType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class OwnerCreateOrderRequest {

    @NotNull
    private UUID deviceId;

    @NotNull
    private OrderType type;

    public UUID getDeviceId() { return deviceId; }

    public OrderType getType() { return type; }

    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }

    public void setType(OrderType type) { this.type = type; }
}