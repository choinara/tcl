package com.peakmate.backend.global.config;

import com.peakmate.core.config.SecurityProperties;
import com.peakmate.core.crypto.AES256Encryptor;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

/**
 * AES-256 암호화 키 초기화 설정.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class EncryptionConfig {

    private final SecurityProperties securityProperties;

    @PostConstruct
    public void init() {
        String encryptionKey = securityProperties.encryption().key();
        String previousEncryptionKey = securityProperties.encryption().previousKey();

        if (encryptionKey != null && !encryptionKey.isBlank()) {
            AES256Encryptor.getInstance().init(encryptionKey);
            log.info("AES-256 encryption initialized");

            // 키 로테이션 지원: 이전 키가 있으면 복호화 폴백용으로 등록
            if (previousEncryptionKey != null && !previousEncryptionKey.isBlank()) {
                AES256Encryptor.getInstance().rotateKey(encryptionKey);
                // rotateKey는 현재키→이전키로 보관하므로, 이전키로 init 후 새 키로 rotate
                AES256Encryptor instance = AES256Encryptor.getInstance();
                instance.init(previousEncryptionKey);
                instance.rotateKey(encryptionKey);
                log.info("AES-256 key rotation configured with previous key fallback");
            }
        } else {
            throw new IllegalStateException(
                    "암호키가 설정되지 않았습니다. 환경변수 ENCRYPTION_KEY를 설정하세요. " +
                    "개인정보 평문 저장은 허용되지 않습니다.");
        }
    }
}
