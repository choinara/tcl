package com.peakmate.backend.domain.auth.service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;

/**
 * TOTP (Time-based One-Time Password) 서비스.
 * Google Authenticator 호환 MFA/OTP를 제공합니다.
 */
@Service
@Slf4j
public class TotpService {

    @Value("${security.mfa.issuer:Peakmate}")
    private String issuer;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(codeGenerator, new SystemTimeProvider());

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String generateQrCodeBase64(String secret, String username) {
        try {
            QrData data = new QrData.Builder()
                    .label(username)
                    .secret(secret)
                    .issuer(issuer)
                    .algorithm(HashingAlgorithm.SHA1)
                    .digits(6)
                    .period(30)
                    .build();

            ZxingPngQrGenerator qrGenerator = new ZxingPngQrGenerator();
            byte[] qrImage = qrGenerator.generate(data);
            return Base64.getEncoder().encodeToString(qrImage);
        } catch (Exception e) {
            log.error("Failed to generate QR code for user: {}", username, e);
            throw new RuntimeException("QR코드 생성에 실패했습니다", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }
}
