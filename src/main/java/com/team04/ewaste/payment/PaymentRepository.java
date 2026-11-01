package com.team04.ewaste.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Payment> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<Payment> findByIdAndUserId(UUID id, UUID userId);

    Optional<Payment> findByProviderAndProviderIntentId(PaymentProvider provider, String providerIntentId);

    boolean existsByOrderIdAndStatus(UUID orderId, PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @Query("select coalesce(sum(p.amount), 0) from Payment p")
    BigDecimal sumAllAmount();

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

    @Query("""
            select p
            from Payment p
            where (:status is null or p.status = :status)
              and (:provider is null or p.provider = :provider)
              and (:from is null or p.createdAt >= :from)
              and (:to is null or p.createdAt < :to)
            order by p.createdAt desc
            """)
    List<Payment> search(@Param("status") PaymentStatus status,
                         @Param("provider") PaymentProvider provider,
                         @Param("from") Instant from,
                         @Param("to") Instant to);
}
