package com.peakmate.backend.domain.auth;

/**
 * 비밀번호 매칭을 위한 Domain 계층 인터페이스.
 * 실제 구현은 Infra 계층에서 PasswordEncoder를 사용하여 수행합니다.
 */
public interface PasswordMatcher {

    /**
     * 입력된 비밀번호와 암호화된 비밀번호가 일치하는지 확인
     *
     * @param rawPassword     입력된 평문 비밀번호
     * @param encodedPassword DB에 저장된 암호화된 비밀번호
     * @return 일치 여부
     */
    boolean matches(String rawPassword, String encodedPassword);

    /**
     * 비밀번호가 마이그레이션이 필요한지 확인
     * (레거시 형식인 경우 true 반환)
     *
     * @param encodedPassword DB에 저장된 암호화된 비밀번호
     * @return 마이그레이션 필요 여부
     */
    boolean needsMigration(String encodedPassword);
}
