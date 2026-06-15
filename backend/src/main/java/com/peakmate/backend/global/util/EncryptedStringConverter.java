package com.peakmate.backend.global.util;

import com.peakmate.core.crypto.AES256Encryptor;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA AttributeConverter: 개인정보(이메일 등) DB 저장 시 AES-256-GCM 암호화.
 * "ENC:" 접두사로 암호화 여부 구분 (기존 평문 데이터 호환).
 */
@Converter
@Slf4j
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String PREFIX = "ENC:";

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) return attribute;

        AES256Encryptor encryptor = AES256Encryptor.getInstance();
        if (!encryptor.isConfigured()) {
            throw new IllegalStateException("암호키가 설정되지 않았습니다. 개인정보 평문 저장은 허용되지 않습니다.");
        }

        try {
            return PREFIX + encryptor.encrypt(attribute);
        } catch (Exception e) {
            throw new RuntimeException("개인정보 암호화에 실패했습니다.", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return dbData;

        if (!dbData.startsWith(PREFIX)) {
            return dbData; // 평문 데이터 (하위 호환)
        }

        AES256Encryptor encryptor = AES256Encryptor.getInstance();
        if (!encryptor.isConfigured()) return dbData;

        try {
            return encryptor.decrypt(dbData.substring(PREFIX.length()));
        } catch (Exception e) {
            log.warn("Decryption failed, returning raw data: {}", e.getMessage());
            return dbData;
        }
    }
}
