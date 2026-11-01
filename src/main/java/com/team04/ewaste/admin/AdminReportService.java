package com.team04.ewaste.admin;

import com.team04.ewaste.admin.dto.DeviceProcessingReportResponse;
import com.team04.ewaste.admin.dto.PaymentsReportResponse;
import com.team04.ewaste.device.*;
import com.team04.ewaste.payment.PaymentRepository;
import com.team04.ewaste.payment.PaymentStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AdminReportService {

    private final DeviceRepository deviceRepository;
    private final PaymentRepository paymentRepository;

    public AdminReportService(DeviceRepository deviceRepository,
                              PaymentRepository paymentRepository) {
        this.deviceRepository = deviceRepository;
        this.paymentRepository = paymentRepository;
    }

    public DeviceProcessingReportResponse getDeviceProcessingReport() {

        DeviceProcessingReportResponse res = new DeviceProcessingReportResponse();

        res.totalDevices = deviceRepository.count();

        // classification
        res.currentDevices = deviceRepository.countByClassification(DeviceClassification.CURRENT);
        res.recycleDevices = deviceRepository.countByClassification(DeviceClassification.RECYCLE);
        res.rareDevices = deviceRepository.countByClassification(DeviceClassification.RARE);
        res.unknownDevices = deviceRepository.countByClassification(DeviceClassification.UNKNOWN);
        res.unwantedDevices = deviceRepository.countByClassification(DeviceClassification.UNWANTED);

        // workflow status
        res.submittedDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.SUBMITTED);
        res.underReviewDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.UNDER_REVIEW);
        res.publishedDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.PUBLISHED);
        res.hiddenDevices = deviceRepository.countByWorkflowStatus(DeviceWorkflowStatus.HIDDEN);

        // visibility
        res.draftDevices = deviceRepository.countByVisibility(DeviceVisibility.DRAFT);
        res.visibleDevices = deviceRepository.countByVisibility(DeviceVisibility.VISIBLE);
        res.hiddenVisibilityDevices = deviceRepository.countByVisibility(DeviceVisibility.HIDDEN);

        return res;
    }

    public PaymentsReportResponse getPaymentsReport() {
        PaymentsReportResponse res = new PaymentsReportResponse();

        res.totalPayments = paymentRepository.count();
        res.initiatedPayments = paymentRepository.countByStatus(PaymentStatus.INITIATED);
        res.succeededPayments = paymentRepository.countByStatus(PaymentStatus.SUCCEEDED);
        res.failedPayments = paymentRepository.countByStatus(PaymentStatus.FAILED);
        res.refundedPayments = paymentRepository.countByStatus(PaymentStatus.REFUNDED)
                + paymentRepository.countByStatus(PaymentStatus.PARTIALLY_REFUNDED);

        BigDecimal total = paymentRepository.sumAllAmount();
        BigDecimal succeeded = paymentRepository.sumAmountByStatus(PaymentStatus.SUCCEEDED);

        res.totalAmount = total == null ? BigDecimal.ZERO : total;
        res.succeededAmount = succeeded == null ? BigDecimal.ZERO : succeeded;

        return res;
    }
}
