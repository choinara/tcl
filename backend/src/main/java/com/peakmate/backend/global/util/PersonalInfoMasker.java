package com.peakmate.backend.global.util;

/**
 * 개인정보 마스킹 유틸리티.
 * API 응답에서 개인정보를 마스킹 처리합니다.
 */
public final class PersonalInfoMasker {

    private PersonalInfoMasker() {}

    /**
     * PII 접근 등급.
     * FULL: 마스킹 없이 전체 노출 (본인 조회 또는 SYSTEM_ADMIN)
     * PARTIAL: 부분 마스킹 (일반 관리자)
     * NONE: 완전 마스킹 (권한 없음)
     */
    public enum AccessLevel { FULL, PARTIAL, NONE }

    /**
     * 역할 기반 접근 등급 결정.
     */
    public static AccessLevel resolveAccessLevel(java.util.List<String> roles, boolean isSelf) {
        if (isSelf) return AccessLevel.FULL;
        if (roles != null && roles.contains("SUPER_ADMIN")) return AccessLevel.FULL;
        if (roles != null && roles.contains("ADMIN")) return AccessLevel.PARTIAL;
        return AccessLevel.NONE;
    }

    /**
     * 접근 등급에 따른 이메일 처리.
     */
    public static String maskEmail(String email, AccessLevel level) {
        return switch (level) {
            case FULL -> email;
            case PARTIAL -> maskEmail(email);
            case NONE -> email == null ? null : "***@***.***";
        };
    }

    /**
     * 접근 등급에 따른 이름 처리.
     */
    public static String maskName(String name, AccessLevel level) {
        return switch (level) {
            case FULL -> name;
            case PARTIAL -> maskName(name);
            case NONE -> "***";
        };
    }

    /**
     * 접근 등급에 따른 전화번호 처리.
     */
    public static String maskPhone(String phone, AccessLevel level) {
        return switch (level) {
            case FULL -> phone;
            case PARTIAL -> maskPhone(phone);
            case NONE -> "***-****-****";
        };
    }

    /**
     * 이메일 마스킹: user@domain.com → us***@domain.com
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) return email;
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) return "***";
        String local = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (local.length() <= 2) {
            return local.charAt(0) + "***" + domain;
        }
        return local.substring(0, 2) + "***" + domain;
    }

    /**
     * 전화번호 마스킹: 010-1234-5678 → 010-****-5678
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return phone;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() < 7) return "***-****-***";
        if (digits.length() == 11) {
            return digits.substring(0, 3) + "-****-" + digits.substring(7);
        }
        if (digits.length() == 10) {
            return digits.substring(0, 3) + "-***-" + digits.substring(6);
        }
        return digits.substring(0, 3) + "-****-" + digits.substring(digits.length() - 4);
    }

    /**
     * 이름 마스킹: 홍길동 → 홍*동, 김철 → 김*
     */
    public static String maskName(String name) {
        if (name == null || name.isBlank()) return name;
        if (name.length() == 1) return "*";
        if (name.length() == 2) return name.charAt(0) + "*";
        StringBuilder sb = new StringBuilder();
        sb.append(name.charAt(0));
        for (int i = 1; i < name.length() - 1; i++) {
            sb.append('*');
        }
        sb.append(name.charAt(name.length() - 1));
        return sb.toString();
    }

    /**
     * 계좌번호 마스킹: 1234567890 → 1234****90
     */
    public static String maskAccountNumber(String account) {
        if (account == null || account.isBlank()) return account;
        String digits = account.replaceAll("[^0-9]", "");
        if (digits.length() <= 4) return "****";
        return digits.substring(0, 4) + "****" + digits.substring(digits.length() - 2);
    }

    /**
     * 주민등록번호 마스킹: 900101-1234567 → 900101-*******
     */
    public static String maskSsn(String ssn) {
        if (ssn == null || ssn.isBlank()) return ssn;
        String digits = ssn.replaceAll("[^0-9]", "");
        if (digits.length() >= 13) {
            return digits.substring(0, 6) + "-*******";
        }
        return ssn.substring(0, Math.min(6, ssn.length())) + "-*******";
    }

    /**
     * 카드번호 마스킹: 1234-5678-9012-3456 → 1234-****-****-3456
     */
    public static String maskCardNumber(String card) {
        if (card == null || card.isBlank()) return card;
        String digits = card.replaceAll("[^0-9]", "");
        if (digits.length() < 13) return "****-****-****-****";
        return digits.substring(0, 4) + "-****-****-" + digits.substring(digits.length() - 4);
    }

    /**
     * 주소 마스킹: 서울시 강남구 역삼동 123-4 → 서울시 강남구 ***
     */
    public static String maskAddress(String address) {
        if (address == null || address.isBlank()) return address;
        // 시/도 + 구/군 까지만 노출
        String[] parts = address.split("\\s+");
        if (parts.length <= 2) return parts[0] + " ***";
        return parts[0] + " " + parts[1] + " ***";
    }
}
