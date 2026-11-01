package com.team04.ewaste.payment;

public enum PaymentProvider {
    STRIPE,
    PAYPAL;

    public String toDb() {
        return name().toLowerCase();
    }

    public static PaymentProvider fromDb(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return PaymentProvider.valueOf(value.trim().toUpperCase());
    }
}
