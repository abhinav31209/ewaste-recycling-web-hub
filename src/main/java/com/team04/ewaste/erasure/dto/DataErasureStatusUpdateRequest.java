package com.team04.ewaste.erasure.dto;

import com.team04.ewaste.erasure.DataErasureStatus;

public record DataErasureStatusUpdateRequest(
        DataErasureStatus status,
        String certificateCode,
        String staffNote
) {
}
