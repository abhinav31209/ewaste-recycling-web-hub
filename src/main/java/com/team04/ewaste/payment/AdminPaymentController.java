package com.team04.ewaste.payment;

import com.team04.ewaste.admin.AdminReportService;
import com.team04.ewaste.admin.dto.PaymentsReportResponse;
import com.team04.ewaste.payment.dto.PaymentRefundRequest;
import com.team04.ewaste.payment.dto.PaymentResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final AdminReportService adminReportService;

    public AdminPaymentController(PaymentService paymentService, AdminReportService adminReportService) {
        this.paymentService = paymentService;
        this.adminReportService = adminReportService;
    }

    @GetMapping("/payments")
    public List<PaymentResponse> search(@RequestParam(required = false) String status,
                                        @RequestParam(required = false) String provider,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return paymentService.searchForStaff(status, provider, from, to);
    }

    @GetMapping("/payments/{paymentId}")
    public PaymentResponse get(@PathVariable UUID paymentId) {
        return paymentService.getForStaff(paymentId);
    }

    @GetMapping("/reports/payments")
    public PaymentsReportResponse report() {
        return adminReportService.getPaymentsReport();
    }

    @PostMapping("/payments/{paymentId}/capture")
    public PaymentResponse capture(@PathVariable UUID paymentId) {
        return paymentService.captureForStaff(paymentId);
    }

    @PostMapping("/payments/{paymentId}/fail")
    public PaymentResponse fail(@PathVariable UUID paymentId, @RequestParam(required = false) String reason) {
        return paymentService.failForStaff(paymentId, reason);
    }

    @PostMapping("/payments/{paymentId}/refund")
    public PaymentResponse refund(@PathVariable UUID paymentId, @Valid @RequestBody(required = false) PaymentRefundRequest request) {
        return paymentService.refundForStaff(paymentId, request);
    }
}
