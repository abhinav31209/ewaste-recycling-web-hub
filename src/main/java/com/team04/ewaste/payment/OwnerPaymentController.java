package com.team04.ewaste.payment;

import com.team04.ewaste.payment.dto.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/owner")
public class OwnerPaymentController {

    private final PaymentService paymentService;

    public OwnerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/payments/providers")
    public List<PaymentProviderResponse> providers() {
        return paymentService.providers();
    }

    @GetMapping("/payments")
    public List<PaymentResponse> listMine(Authentication auth) {
        return paymentService.listMine(auth.getName());
    }

    @GetMapping("/payments/{paymentId}")
    public PaymentResponse getMine(@PathVariable UUID paymentId, Authentication auth) {
        return paymentService.getMine(auth.getName(), paymentId);
    }

    @GetMapping("/orders/{orderId}/payments")
    public List<PaymentResponse> listMineForOrder(@PathVariable UUID orderId, Authentication auth) {
        return paymentService.listMineForOrder(auth.getName(), orderId);
    }

    @GetMapping("/orders/{orderId}/payment-quote")
    public PaymentQuoteResponse quote(@PathVariable UUID orderId,
                                      @RequestParam(defaultValue = "false") boolean storageExtension,
                                      Authentication auth) {
        return paymentService.quoteMine(auth.getName(), orderId, storageExtension);
    }

    @PostMapping("/payments")
    public PaymentResponse create(@Valid @RequestBody PaymentCreateRequest request, Authentication auth) {
        return paymentService.createMine(auth.getName(), request);
    }

    @PostMapping("/payments/simulate")
    public PaymentResponse simulate(@Valid @RequestBody PaymentCreateRequest request, Authentication auth) {
        return paymentService.simulateMine(auth.getName(), request);
    }

    @PostMapping("/payments/{paymentId}/capture")
    public PaymentResponse capture(@PathVariable UUID paymentId, Authentication auth) {
        return paymentService.captureMine(auth.getName(), paymentId);
    }

    @PostMapping("/payments/{paymentId}/complete-sandbox")
    public PaymentResponse completeSandbox(@PathVariable UUID paymentId, Authentication auth) {
        return paymentService.completeSandboxMine(auth.getName(), paymentId);
    }

    @PostMapping("/payments/{paymentId}/cancel")
    public PaymentResponse cancel(@PathVariable UUID paymentId, Authentication auth) {
        return paymentService.cancelMine(auth.getName(), paymentId);
    }

    @PatchMapping("/payments/{paymentId}/status")
    public PaymentResponse updateStatus(@PathVariable UUID paymentId,
                                        @Valid @RequestBody PaymentStatusUpdateRequest request,
                                        Authentication auth) {
        return paymentService.updateMineStatus(auth.getName(), paymentId, request);
    }
}
