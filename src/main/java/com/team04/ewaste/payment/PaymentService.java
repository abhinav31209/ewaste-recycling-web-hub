package com.team04.ewaste.payment;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.payment.dto.*;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.device.DeviceWorkflowStatus;
import com.team04.ewaste.staff.Order;
import com.team04.ewaste.staff.OrderPaymentStatus;
import com.team04.ewaste.staff.OrderRepository;
import com.team04.ewaste.staff.OrderStatus;
import com.team04.ewaste.staff.OrderType;
import com.team04.ewaste.owner.OwnerOrderService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    public static final BigDecimal DATA_RETRIEVAL_PRICE = new BigDecimal("24.99");
    public static final BigDecimal STORAGE_EXTENSION_PRICE = new BigDecimal("7.99");
    public static final String DEFAULT_CURRENCY = "GBP";

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OwnerOrderService ownerOrderService;
    private final DeviceRepository deviceRepository;

    public PaymentService(PaymentRepository paymentRepository, 
                          OrderRepository orderRepository, 
                          UserRepository userRepository, 
                          OwnerOrderService ownerOrderService,
                          DeviceRepository deviceRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.ownerOrderService = ownerOrderService;
        this.deviceRepository = deviceRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentProviderResponse> providers() {
        return List.of(new PaymentProviderResponse("stripe", "Stripe", "sandbox", true), new PaymentProviderResponse("paypal", "PayPal", "sandbox", true));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listMine(String email) {
        User owner = findUser(email);
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(owner.getId()).stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.CANCELLED)
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getMine(String email, UUID paymentId) {
        User owner = findUser(email);
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, owner.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listMineForOrder(String email, UUID orderId) {
        Order order = findOwnedOrder(email, orderId);
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.CANCELLED)
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentQuoteResponse quoteMine(String email, UUID orderId, boolean storageExtension) {
        Order order = findOwnedOrder(email, orderId);

        if (order.getType() != OrderType.DATA_RETRIEVAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quote is only available for data retrieval orders");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot quote a cancelled order");
        }
        if (order.getStatus() != OrderStatus.PAYMENT_PENDING
                && order.getStatus() != OrderStatus.PAID
                && order.getStatus() != OrderStatus.READY_FOR_FULFILLMENT
                && order.getStatus() != OrderStatus.FULFILLED
                && order.getStatus() != OrderStatus.EXPIRED
                && order.getStatus() != OrderStatus.RESTORED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is not in a payable retrieval state");
        }

        if (storageExtension) {
            validateStorageExtensionQuote(order);
        } else if (paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCEEDED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order already has a successful payment");
        }

        return buildQuote(order, storageExtension);
    }

    @Transactional
    public PaymentResponse createMine(String email, PaymentCreateRequest request) {
        User owner = findUser(email);
        PaymentProvider provider = parseProvider(request.provider());
        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        String currency = normalizeCurrency(request.currency());

        if (request.orderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment must be linked to a data retrieval order");
        }

        Order order = findOwnedOrder(email, request.orderId());
        validateOrderPayment(order, amount, request.metadata(), request.description());

        Payment payment = new Payment();
        payment.setUserId(owner.getId());
        payment.setOrderId(order.getId());
        payment.setProvider(provider);
        payment.setProviderIntentId(buildProviderIntentId(provider));
        payment.setCheckoutUrl(buildSandboxCheckoutUrl(provider, payment.getProviderIntentId()));
        payment.setAmount(amount);
        payment.setRefundedAmount(BigDecimal.ZERO);
        payment.setCurrency(currency);
        payment.setDescription(defaultDescription(order, request.metadata(), request.description()));
        payment.setMetadata(enrichMetadata(request.metadata(), request.returnUrl(), request.cancelUrl()));
        if (Boolean.TRUE.equals(request.autoSucceed())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owners cannot mark payments as succeeded. Payment success must be confirmed by staff or admin.");
        }
        payment.setStatus(PaymentStatus.INITIATED);
        Payment saved = paymentRepository.save(payment);
        order.setPaymentStatus(OrderPaymentStatus.INITIATED);
        order.setPaymentId(saved.getId());
        orderRepository.save(order);
        return PaymentResponse.from(saved);
    }

    @Transactional
    public PaymentResponse simulateMine(String email, PaymentCreateRequest request) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owners cannot simulate successful payments. Payment success must be confirmed by staff or admin.");
    }

    @Transactional
    public PaymentResponse captureMine(String email, UUID paymentId) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owners cannot capture payments. Payment success must be confirmed by staff or admin.");
    }

    @Transactional
    public PaymentResponse completeSandboxMine(String email, UUID paymentId) {
        User owner = findUser(email);
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!Boolean.TRUE.equals(payment.getMetadata() == null ? null : payment.getMetadata().get("sandbox"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only sandbox payments can be completed from the owner checkout flow.");
        }

        if (payment.getStatus() != PaymentStatus.INITIATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only initiated sandbox payments can be completed.");
        }

        return applyStatus(payment, PaymentStatus.SUCCEEDED, "Completed from owner sandbox checkout");
    }

    @Transactional
    public PaymentResponse cancelMine(String email, UUID paymentId) {
        User owner = findUser(email);
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, owner.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return applyStatus(payment, PaymentStatus.CANCELLED, "Cancelled by owner in sandbox");
    }

    @Transactional
    public PaymentResponse updateMineStatus(String email, UUID paymentId, PaymentStatusUpdateRequest request) {
        PaymentStatus status = parseStatus(request.status());
        if (status == PaymentStatus.SUCCEEDED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owners cannot mark payments as succeeded. Payment success must be confirmed by staff or admin.");
        }
        if (status != PaymentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owners can only cancel their own payments");
        }
        User owner = findUser(email);
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, owner.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return applyStatus(payment, status, request.reason());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> searchForStaff(String status, String provider, Instant from, Instant to) {
        PaymentStatus parsedStatus = parseNullableStatus(status);
        PaymentProvider parsedProvider = parseNullableProvider(provider);

        return paymentRepository.findAll().stream()
                .filter(payment -> parsedStatus == null || payment.getStatus() == parsedStatus)
                .filter(payment -> parsedProvider == null || payment.getProvider() == parsedProvider)
                .filter(payment -> from == null || (payment.getCreatedAt() != null && !payment.getCreatedAt().isBefore(from)))
                .filter(payment -> to == null || (payment.getCreatedAt() != null && payment.getCreatedAt().isBefore(to)))
                .sorted((left, right) -> {
                    Instant leftCreated = left.getCreatedAt() == null ? Instant.EPOCH : left.getCreatedAt();
                    Instant rightCreated = right.getCreatedAt() == null ? Instant.EPOCH : right.getCreatedAt();
                    return rightCreated.compareTo(leftCreated);
                })
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getForStaff(UUID paymentId) {
        return PaymentResponse.from(findPayment(paymentId));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listForOrderForStaff(UUID orderId) {
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream().map(PaymentResponse::from).toList();
    }

    @Transactional
    public PaymentResponse captureForStaff(UUID paymentId) {
        return applyStatus(findPayment(paymentId), PaymentStatus.SUCCEEDED, null);
    }

    @Transactional
    public PaymentResponse failForStaff(UUID paymentId, String reason) {
        return applyStatus(findPayment(paymentId), PaymentStatus.FAILED, reason == null || reason.isBlank() ? "Sandbox failure" : reason);
    }

    @Transactional
    public PaymentResponse refundForStaff(UUID paymentId, PaymentRefundRequest request) {
        Payment payment = findPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.SUCCEEDED && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only successful payments can be refunded");
        }
        BigDecimal requested = request == null || request.amount() == null ? remainingRefundable(payment) : request.amount().setScale(2, RoundingMode.HALF_UP);
        if (requested.signum() <= 0 || requested.compareTo(remainingRefundable(payment)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refund amount exceeds refundable balance");
        }
        payment.setRefundedAmount(payment.getRefundedAmount().add(requested));
        payment.setRefundedAt(Instant.now());
        payment.setFailureReason(request == null ? null : request.reason());
        payment.setStatus(remainingRefundable(payment).signum() == 0 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private PaymentResponse applyStatus(Payment payment, PaymentStatus newStatus, String reason) {
        if (payment.getStatus() == PaymentStatus.REFUNDED || payment.getStatus() == PaymentStatus.PARTIALLY_REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Refunded payments cannot be changed");
        }
        if (payment.getStatus() == PaymentStatus.SUCCEEDED && newStatus != PaymentStatus.REFUNDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Successful payments cannot be changed except by refund");
        }
        payment.setStatus(newStatus);
        payment.setFailureReason(reason);
        Order order = payment.getOrderId() == null ? null : orderRepository.findById(payment.getOrderId()).orElse(null);
        if (newStatus == PaymentStatus.SUCCEEDED) {
            payment.setPaidAt(Instant.now());
            afterSuccessfulPayment(order, payment);
        } else if (order != null && (newStatus == PaymentStatus.CANCELLED || newStatus == PaymentStatus.FAILED)) {
            order.setPaymentStatus(newStatus == PaymentStatus.CANCELLED ? OrderPaymentStatus.CANCELLED : OrderPaymentStatus.FAILED);
            order.setStatus(OrderStatus.PAYMENT_PENDING);
            orderRepository.save(order);
        }
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private void afterSuccessfulPayment(Order order, Payment payment) {
        if (order == null) return;
        if (order.getStatus() == OrderStatus.PAYMENT_PENDING || order.getStatus() == OrderStatus.CREATED) {
            order.setStatus(OrderStatus.READY_FOR_FULFILLMENT);
        }
        order.setPaymentStatus(OrderPaymentStatus.SUCCEEDED);
        order.setPaidAt(payment.getPaidAt() == null ? Instant.now() : payment.getPaidAt());
        order.setPaymentId(payment.getId());
        
        if (order.getType() == OrderType.DATA_RETRIEVAL
                && isStorageExtension(payment.getMetadata(), payment.getDescription())) {
            ownerOrderService.restoreAfterExtensionPayment(order.getId());
            return;
        }

        orderRepository.save(order);
        if (order.getDeviceId() != null) {
            deviceRepository.findById(order.getDeviceId()).ifPresent(device -> {
                device.setWorkflowStatus(DeviceWorkflowStatus.RETRIEVAL_PAID);
                deviceRepository.save(device);
            });
        }
    }

    private void validateOrderPayment(Order order, BigDecimal amount, Map<String, Object> metadata, String description) {
        if (order.getType() != OrderType.DATA_RETRIEVAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payments are only supported for data retrieval orders");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot pay for a cancelled order");
        }
        if (order.getStatus() != OrderStatus.PAYMENT_PENDING && order.getStatus() != OrderStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only payment-pending retrieval orders can start checkout");
        }
        boolean extension = isStorageExtension(metadata, description);

        if (extension && !paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCEEDED)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Initial data retrieval payment must succeed before storage can be extended"
            );
        }

        if (order.getType() == OrderType.DATA_RETRIEVAL && paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCEEDED) && !extension) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order already has a successful payment");
        }
        BigDecimal expected = extension ? STORAGE_EXTENSION_PRICE : DATA_RETRIEVAL_PRICE;
        if (amount.compareTo(expected) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must match the quoted fee");
        }
    }

    private void validateStorageExtensionQuote(Order order) {
        if (!paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCEEDED)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Initial data retrieval payment must succeed before storage can be extended"
            );
        }

        if (order.isHardDeleted()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Order data deleted");
        }

        if (order.getFulfilledAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has not been fulfilled");
        }

        if (order.getExpiresAt() == null || !Instant.now().isAfter(order.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not expired yet");
        }

        Instant now = Instant.now();
        Instant from = plusMonths(order.getFulfilledAt(), 3);
        Instant to = plusMonths(order.getFulfilledAt(), 6);

        if (now.isBefore(from) || now.isAfter(to)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Restore allowed only between 3 and 6 months after fulfillment"
            );
        }
    }

    private PaymentQuoteResponse buildQuote(Order order, boolean storageExtension) {
        BigDecimal price = storageExtension ? STORAGE_EXTENSION_PRICE : DATA_RETRIEVAL_PRICE;
        Map<String, BigDecimal> breakdown = new LinkedHashMap<>();
        breakdown.put(storageExtension ? "three_month_storage_extension" : "data_retrieval_and_secure_cloud_link", price);
        return new PaymentQuoteResponse(order.getId(), storageExtension ? "Extra 3 months secure cloud storage" : "Data retrieval service", price, DEFAULT_CURRENCY, storageExtension ? "Extends access to retrieved data for another 3 months." : "Covers data retrieval from a recycle device. Data wiping remains free.", breakdown);
    }

    private Order findOwnedOrder(String email, UUID orderId) {
        User owner = findUser(email);
        return orderRepository.findByIdAndUserId(orderId, owner.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private Payment findPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static PaymentProvider parseProvider(String value) {
        try { return PaymentProvider.fromDb(value); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid provider. Use stripe or paypal"); }
    }

    private static PaymentProvider parseNullableProvider(String value) {
        if (value == null || value.isBlank()) return null;
        return parseProvider(value);
    }

    private static PaymentStatus parseStatus(String value) {
        try { return PaymentStatus.fromDb(value); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment status"); }
    }

    private static PaymentStatus parseNullableStatus(String value) {
        if (value == null || value.isBlank()) return null;
        return parseStatus(value);
    }

    private static String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) return DEFAULT_CURRENCY;
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("[A-Z]{3}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Currency must be a 3-letter ISO code");
        return normalized;
    }

    private static String buildProviderIntentId(PaymentProvider provider) {
        return provider.toDb() + "_sandbox_" + UUID.randomUUID();
    }

    private static String buildSandboxCheckoutUrl(PaymentProvider provider, String intentId) {
        return provider == PaymentProvider.STRIPE ? "https://checkout.stripe.com/c/pay/" + intentId : "https://www.sandbox.paypal.com/checkoutnow?token=" + intentId;
    }

    private static String defaultDescription(Order order, Map<String, Object> metadata, String description) {
        if (description != null && !description.isBlank()) return description.trim();
        if (isStorageExtension(metadata, null)) return "Secure cloud storage extension payment";
        if (order != null && order.getType() == OrderType.DATA_RETRIEVAL) return "Data retrieval payment";
        return "eWaste payment";
    }

    private static Map<String, Object> enrichMetadata(Map<String, Object> metadata, String returnUrl, String cancelUrl) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (metadata != null) out.putAll(metadata);
        if (returnUrl != null && !returnUrl.isBlank()) out.put("returnUrl", returnUrl);
        if (cancelUrl != null && !cancelUrl.isBlank()) out.put("cancelUrl", cancelUrl);
        out.put("sandbox", true);
        return out;
    }

    private static boolean isStorageExtension(Map<String, Object> metadata, String description) {
        if (description != null && description.toLowerCase(Locale.ROOT).contains("storage extension")) return true;
        if (metadata == null) return false;
        Object type = metadata.get("type");
        Object desc = metadata.get("description");
        return (type instanceof String t && t.equalsIgnoreCase("storage_extension")) || (desc instanceof String d && d.toLowerCase(Locale.ROOT).contains("storage extension"));
    }

    private static BigDecimal remainingRefundable(Payment payment) {
        BigDecimal refunded = payment.getRefundedAmount() == null ? BigDecimal.ZERO : payment.getRefundedAmount();
        return payment.getAmount().subtract(refunded);
    }

    private static Instant plusMonths(Instant base, int months) {
        return ZonedDateTime.ofInstant(base, ZoneOffset.UTC).plusMonths(months).toInstant();
    }
}
