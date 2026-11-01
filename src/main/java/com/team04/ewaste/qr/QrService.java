package com.team04.ewaste.qr;

import com.team04.ewaste.device.Device;
import com.team04.ewaste.device.DeviceRepository;
import com.team04.ewaste.qr.dto.QrDeviceResponse;
import com.team04.ewaste.qr.dto.QrTokenResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class QrService {

    private final QrAccessTokenRepository qrAccessTokenRepository;
    private final DeviceRepository deviceRepository;

    public QrService(QrAccessTokenRepository qrAccessTokenRepository,
                     DeviceRepository deviceRepository) {
        this.qrAccessTokenRepository = qrAccessTokenRepository;
        this.deviceRepository = deviceRepository;
    }

    public QrTokenResponse generateTokenForDevice(UUID deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(30);

        QrAccessToken qrAccessToken = new QrAccessToken(
                token,
                device,
                true,
                now,
                expiresAt
        );

        qrAccessTokenRepository.save(qrAccessToken);

        return new QrTokenResponse(token, expiresAt);
    }

    public QrDeviceResponse resolveToken(String token) {
        QrAccessToken qrAccessToken = qrAccessTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("QR token not found"));

        if (!qrAccessToken.isActive()) {
            throw new RuntimeException("QR token is inactive");
        }

        if (qrAccessToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("QR token has expired");
        }

        Device device = qrAccessToken.getDevice();

        return new QrDeviceResponse(
                device.getId(),
                device.getBrand(),
                device.getDeviceName(),
                device.getCondition(),
                device.getClassification() != null ? device.getClassification().name() : null,
                device.getWorkflowStatus() != null ? device.getWorkflowStatus().name() : null
        );
    }
}