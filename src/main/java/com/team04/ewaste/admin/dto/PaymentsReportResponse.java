package com.team04.ewaste.admin.dto;

import java.math.BigDecimal;

public class PaymentsReportResponse {

    public long totalPayments;
    public long initiatedPayments;
    public long succeededPayments;
    public long failedPayments;
    public long refundedPayments;

    public BigDecimal totalAmount = BigDecimal.ZERO;
    public BigDecimal succeededAmount = BigDecimal.ZERO;
}