package com.team04.ewaste.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByUserId(UUID userId);

    Optional<Order> findByIdAndUserId(UUID orderId, UUID userId);

    List<Order> findByDeviceId(UUID deviceId);

    List<Order> findByDeviceIdAndType(UUID deviceId, OrderType type);

    @Query("select o from Order o where o.deviceId = :deviceId and o.type = :type and o.hardDeleted = false order by o.createdAt desc")
    List<Order> findActiveByDeviceIdAndTypeOrderByCreatedAtDesc(UUID deviceId, OrderType type);
}
