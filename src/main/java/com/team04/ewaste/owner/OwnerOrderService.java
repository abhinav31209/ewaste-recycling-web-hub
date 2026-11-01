package com.team04.ewaste.owner;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.auth.UserRepository;
import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceClassification;
import com.team04.ewaste.device.DeviceDataWipeStatus;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.device.DeviceWorkflowStatus;
import com.team04.ewaste.staff.Order;
import com.team04.ewaste.staff.OrderPaymentStatus;
import com.team04.ewaste.staff.OrderRepository;
import com.team04.ewaste.staff.OrderStatus;
import com.team04.ewaste.staff.OrderType;
import com.team04.ewaste.payment.PaymentRepository;
import com.team04.ewaste.payment.PaymentStatus;
import com.team04.ewaste.notification.EmailNotificationService;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.*;

@Service
public class OwnerOrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final PaymentRepository paymentRepository;
    private final EmailNotificationService emailNotificationService;

    public OwnerOrderService(OrderRepository orderRepository,
                             UserRepository userRepository,
                             DeviceRepository deviceRepository,
                             PaymentRepository paymentRepository,
                             EmailNotificationService emailNotificationService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
        this.paymentRepository = paymentRepository;
        this.emailNotificationService = emailNotificationService;
    }

    public Order createDataRetrievalOrder(String email, @NonNull UUID deviceId) {

        User owner = findOwner(email);

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));

        if (!device.getUserId().equals(owner.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Device not found");
        }

        if (device.getClassification() != DeviceClassification.RECYCLE) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Data retrieval only allowed for RECYCLE devices"
            );
        }

        if (!Boolean.TRUE.equals(device.getRetrievalAvailable())) {
            throw new ResponseStatusException(BAD_REQUEST, "Staff data wipe preparation must be completed before retrieval can be requested");
        }

        if (device.getRetrievalAvailableUntil() == null || !Instant.now().isBefore(device.getRetrievalAvailableUntil())) {
            throw new ResponseStatusException(BAD_REQUEST, "Retrieval availability has expired for this device");
        }

        boolean hasActiveOrder = orderRepository
                .findActiveByDeviceIdAndTypeOrderByCreatedAtDesc(deviceId, OrderType.DATA_RETRIEVAL)
                .stream()
                .anyMatch(order -> order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.EXPIRED);

        if (hasActiveOrder) {
            throw new ResponseStatusException(CONFLICT, "An active data retrieval order already exists for this device");
        }

        Order order = new Order(owner.getId(), deviceId, OrderType.DATA_RETRIEVAL);

        order.setStatus(OrderStatus.PAYMENT_PENDING);
        order.setPaymentStatus(OrderPaymentStatus.UNPAID);
        device.setWorkflowStatus(DeviceWorkflowStatus.RETRIEVAL_REQUESTED);

        Order saved = orderRepository.save(order);
        deviceRepository.save(device);
        return saved;
    }

    public List<Order> listMine(String email) {

        User owner = findOwner(email);

        return orderRepository.findByUserId(owner.getId()).stream()
                .map(this::synchronizeExpiryStatus)
                .toList();
    }

    public Order getMineById(String email, UUID orderId) {

        User owner = findOwner(email);

        return orderRepository.findByIdAndUserId(orderId, owner.getId())
                .map(this::synchronizeExpiryStatus)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
    }

    public Map<String, String> getSecureLink(String email, UUID orderId) {

        Order order = getMineById(email, orderId);

        if (order.isHardDeleted()) {
            throw new ResponseStatusException(GONE, "Order data deleted");
        }

        if (order.getStatus() != OrderStatus.FULFILLED
                && order.getStatus() != OrderStatus.RESTORED) {

            throw new ResponseStatusException(CONFLICT, "Order is not fulfilled");
        }

        if (order.getExpiresAt() == null
                || Instant.now().isAfter(order.getExpiresAt())) {

            throw new ResponseStatusException(GONE, "Secure link expired");
        }

        if (order.getRetrievalToken() == null
                || order.getRetrievalToken().isBlank()) {

            throw new ResponseStatusException(CONFLICT, "Secure link not ready");
        }

        return Map.of("token", order.getRetrievalToken());
    }

    public Order restore(String email, UUID orderId) {

        Order order = getMineById(email, orderId);

        order = synchronizeExpiryStatus(order);

        if (order.isHardDeleted()) {
            throw new ResponseStatusException(GONE, "Order data deleted");
        }

        if (order.getFulfilledAt() == null) {
            throw new ResponseStatusException(CONFLICT, "Order has not been fulfilled");
        }

        if (order.getExpiresAt() == null
                || !Instant.now().isAfter(order.getExpiresAt())) {

            throw new ResponseStatusException(BAD_REQUEST, "Order is not expired yet");
        }

        Instant now = Instant.now();

        Instant from = plusMonths(order.getFulfilledAt(), 3);

        Instant to = plusMonths(order.getFulfilledAt(), 6);

        if (now.isBefore(from) || now.isAfter(to)) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Restore allowed only between 3 and 6 months after fulfillment"
            );
        }

        //order.setStatus(OrderStatus.RESTORED);

        //order.setExpiresAt(plusMonths(now, 3));

        //return orderRepository.save(order);
            throw new ResponseStatusException(
                    PAYMENT_REQUIRED,
                    "Storage restore requires a successful extension payment"
            );

    }

    public Order restoreAfterExtensionPayment(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        order = synchronizeExpiryStatus(order);

        if (order.isHardDeleted()) {
            throw new ResponseStatusException(GONE, "Order data deleted");
        }

        if (order.getFulfilledAt() == null) {
            throw new ResponseStatusException(CONFLICT, "Order has not been fulfilled");
        }

        if (order.getExpiresAt() == null
                || !Instant.now().isAfter(order.getExpiresAt())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order is not expired yet");
        }

        Instant now = Instant.now();

        Instant from = plusMonths(order.getFulfilledAt(), 3);
        Instant to = plusMonths(order.getFulfilledAt(), 6);

        if (now.isBefore(from) || now.isAfter(to)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Restore allowed only between 3 and 6 months after fulfillment"
            );
        }

        order.setStatus(OrderStatus.RESTORED);
        order.setExpiresAt(plusMonths(now, 3));

        Order saved = orderRepository.save(order);

        UUID ownerId = saved.getUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        String downloadUrl = "/api/owner/orders/" + saved.getId() + "/secure-link";

        emailNotificationService.sendDataRetrievalRestored(owner, saved, downloadUrl);

        return saved;
    }

    public Order fulfillForStaff(@NonNull UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (order.getType() != OrderType.DATA_RETRIEVAL) {
            throw new ResponseStatusException(BAD_REQUEST, "Order is not a data retrieval order");
        }

        if (order.getPaymentStatus() != OrderPaymentStatus.SUCCEEDED
                && order.getStatus() != OrderStatus.PAID
                && order.getStatus() != OrderStatus.READY_FOR_FULFILLMENT
                && !paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCEEDED)) {
            throw new ResponseStatusException(PAYMENT_REQUIRED, "Data retrieval must be paid before fulfillment");
        }
    
        Instant now = Instant.now();

        order.setFulfilledAt(now);
        order.setExpiresAt(plusMonths(now, 3));
        order.setRetrievalToken(UUID.randomUUID().toString());
        order.setStatus(OrderStatus.FULFILLED);
        order.setPaymentStatus(OrderPaymentStatus.SUCCEEDED);

        Order saved = orderRepository.save(order);

        Device device = deviceRepository.findById(saved.getDeviceId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found"));
        device.setWorkflowStatus(DeviceWorkflowStatus.RETRIEVAL_FULFILLED);
        deviceRepository.save(device);

        UUID ownerId = saved.getUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));


        String downloadUrl = "/api/owner/orders/" + saved.getId() + "/secure-link";

        emailNotificationService.sendDataRetrievalReady(owner, saved, downloadUrl);

        return saved;

    }

    // valid for 3 months, can be retrieved from 3-6 months with a further fee payment, then deleted
    public Order deleteExpiredDataForStaff(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (order.getType() != OrderType.DATA_RETRIEVAL) {
            throw new ResponseStatusException(BAD_REQUEST, "Order is not a data retrieval order");
        }

        if (order.isHardDeleted()) {
            return order;
        }

        if (order.getFulfilledAt() == null) {
            throw new ResponseStatusException(CONFLICT, "Order has not been fulfilled");
        }

        Instant deleteAfter = plusMonths(order.getFulfilledAt(), 6);

        if (Instant.now().isBefore(deleteAfter)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Data can only be deleted after the 6 month retention window"
            );
        }

        order.setRetrievalToken(null);
        order.setHardDeleted(true);

        return orderRepository.save(order);
    }

    private User findOwner(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }

    private Instant plusMonths(Instant base, int months) {

        return ZonedDateTime
                .ofInstant(base, ZoneOffset.UTC)
                .plusMonths(months)
                .toInstant();
    }

    private Order synchronizeExpiryStatus(Order order) {
        if (order == null) {
            return null;
        }

        if ((order.getStatus() == OrderStatus.FULFILLED || order.getStatus() == OrderStatus.RESTORED)
                && order.getExpiresAt() != null
                && !Instant.now().isBefore(order.getExpiresAt())) {
            order.setStatus(OrderStatus.EXPIRED);
            return orderRepository.save(order);
        }

        return order;
    }
}
