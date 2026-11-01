package com.team04.ewaste.payment;

public enum PaymentStatus {
    INITIATED,
    REQUIRES_ACTION,
    SUCCEEDED,
    FAILED,
    CANCELLED,
    REFUNDED,
    PARTIALLY_REFUNDED;

    public String toDb() {
        return name().toLowerCase();
    }

    public static PaymentStatus fromDb(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return PaymentStatus.valueOf(value.trim().toUpperCase());
    }
}
