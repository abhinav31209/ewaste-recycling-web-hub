package com.team04.ewaste.staff;

import com.team04.ewaste.owner.OwnerOrderService;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/orders")
public class StaffOrderController {

    private final OwnerOrderService ownerOrderService;
    private final OrderRepository orderRepository;

    public StaffOrderController(OwnerOrderService ownerOrderService,
                                OrderRepository orderRepository) {
        this.ownerOrderService = ownerOrderService;
        this.orderRepository = orderRepository;
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @GetMapping
    public List<Order> listOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping("/{orderId}/fulfill")
    public Order fulfill(@PathVariable @NonNull UUID orderId) {
        return ownerOrderService.fulfillForStaff(orderId);
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping("/{orderId}/delete-data")
    public Order deleteExpiredData(@PathVariable @NonNull UUID orderId) {
        return ownerOrderService.deleteExpiredDataForStaff(orderId);
    }
}
