package com.team04.ewaste.owner;

import com.team04.ewaste.staff.Order;

import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerOrderController {

    private final OwnerOrderService ownerOrderService;

    public OwnerOrderController(OwnerOrderService ownerOrderService) {
        this.ownerOrderService = ownerOrderService;
    }

    @PostMapping("/devices/{deviceId}/orders/data-retrieval")
    public Order createDataRetrieval(@PathVariable @NonNull UUID deviceId,
                                     Authentication auth) {

        return ownerOrderService.createDataRetrievalOrder(auth.getName(), deviceId);
    }

    @GetMapping("/orders")
    public List<Order> listMine(Authentication auth) {

        return ownerOrderService.listMine(auth.getName());
    }

    @GetMapping("/orders/{orderId}")
    public Order getMine(@PathVariable UUID orderId,
                         Authentication auth) {

        return ownerOrderService.getMineById(auth.getName(), orderId);
    }

    @GetMapping("/orders/{orderId}/secure-link")
    public Map<String, String> getSecureLink(@PathVariable UUID orderId,
                                            Authentication auth) {
        return ownerOrderService.getSecureLink(auth.getName(), orderId);
    }

    @PostMapping("/orders/{orderId}/restore")
    public Order restore(@PathVariable UUID orderId,
                        Authentication auth) {
        return ownerOrderService.restore(auth.getName(), orderId);
    }
}