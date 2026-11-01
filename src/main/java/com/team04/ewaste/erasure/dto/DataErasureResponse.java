package com.team04.ewaste.erasure.dto;

import com.team04.ewaste.erasure.DataErasureStatus;

import java.time.Instant;
import java.util.UUID;

public record DataErasureResponse(
        UUID id,
        UUID deviceId,
        UUID ownerId,
        DataErasureStatus status,
        String erasureProvider,
        String certificateCode,
        String staffNote,
        Instant requestedAt,
        Instant completedAt
) {
}
