package com.team04.ewaste.qr;

import com.team04.ewaste.qr.dto.QrDeviceResponse;
import com.team04.ewaste.qr.dto.QrTokenResponse;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/qr")
public class QrController {

    private final QrService qrService;

    public QrController(QrService qrService) {
        this.qrService = qrService;
    }

    @PostMapping("/devices/{deviceId}/token")
    public QrTokenResponse generateQrToken(@PathVariable UUID deviceId) {
        return qrService.generateTokenForDevice(deviceId);
    }

    @GetMapping("/{token}")
    public QrDeviceResponse resolveQrToken(@PathVariable String token) {
        return qrService.resolveToken(token);
    }
}