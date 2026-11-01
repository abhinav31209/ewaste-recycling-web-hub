package com.team04.ewaste.qr;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QrAccessTokenRepository extends JpaRepository<QrAccessToken, Long> {
    Optional<QrAccessToken> findByToken(String token);
}