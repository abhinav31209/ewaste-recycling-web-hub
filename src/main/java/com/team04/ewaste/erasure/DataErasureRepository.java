package com.team04.ewaste.erasure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DataErasureRepository extends JpaRepository<DataErasureRecord, UUID> {

    Optional<DataErasureRecord> findFirstByDeviceIdOrderByRequestedAtDesc(UUID deviceId);
}
