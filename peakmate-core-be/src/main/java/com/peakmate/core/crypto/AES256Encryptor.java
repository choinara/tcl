package com.peakmate.core.crypto;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM 암호화 유틸리티 (개인정보 암호화 저장용).
 */
public final class AES256Encryptor {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private static AES256Encryptor instance;
    private SecretKeySpec keySpec;
    private SecretKeySpec previousKeySpec;

    private AES256Encryptor() {}

    public static synchronized AES256Encryptor getInstance() {
        if (instance == null) {
            instance = new AES256Encryptor();
        }
        return instance;
    }

    public void init(String hexKey) {
        if (hexKey == null || hexKey.isBlank()) return;
        byte[] keyBytes = hexStringToByteArray(hexKey);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("AES-256 key must be 32 bytes (64 hex chars)");
        }
        this.keySpec = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * 키 로테이션: 이전 키를 보관하여 기존 데이터 복호화를 지원합니다.
     * 새 키로 암호화하되, 복호화 실패 시 이전 키로 재시도합니다.
     */
    public void rotateKey(String newHexKey) {
        if (newHexKey == null || newHexKey.isBlank()) return;
        byte[] newKeyBytes = hexStringToByteArray(newHexKey);
        if (newKeyBytes.length != 32) {
            throw new IllegalArgumentException("AES-256 key must be 32 bytes (64 hex chars)");
        }
        this.previousKeySpec = this.keySpec;
        this.keySpec = new SecretKeySpec(newKeyBytes, "AES");
    }

    public boolean isConfigured() {
        return keySpec != null;
    }

    public String encrypt(String plainText) {
        if (!isConfigured() || plainText == null) return plainText;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes("UTF-8"));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String cipherText) {
        if (!isConfigured() || cipherText == null) return cipherText;
        try {
            return decryptWithKey(cipherText, keySpec);
        } catch (Exception e) {
            // 키 로테이션: 현재 키로 복호화 실패 시 이전 키로 재시도
            if (previousKeySpec != null) {
                try {
                    return decryptWithKey(cipherText, previousKeySpec);
                } catch (Exception ignored) { /* 이전 키로도 복호화 실패 — 외부 catch에서 원본 예외 전파 */ }
            }
            throw new RuntimeException("Decryption failed", e);
        }
    }

    private String decryptWithKey(String cipherText, SecretKeySpec key) throws Exception {
        byte[] decoded = Base64.getDecoder().decode(cipherText);
        ByteBuffer buffer = ByteBuffer.wrap(decoded);

        byte[] iv = new byte[GCM_IV_LENGTH];
        buffer.get(iv);
        byte[] encrypted = new byte[buffer.remaining()];
        buffer.get(encrypted);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        return new String(cipher.doFinal(encrypted), "UTF-8");
    }

    private static byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
