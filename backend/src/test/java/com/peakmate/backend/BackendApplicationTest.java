package com.peakmate.backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 기본 환경 테스트 — JUnit 실행 확인용.
 * <p>Spring Context를 로드하지 않는 순수 단위 테스트입니다.</p>
 */
class BackendApplicationTest {

    @Test
    @DisplayName("JUnit 테스트 환경이 정상적으로 동작한다")
    void junitEnvironmentWorks() {
        assertTrue(true, "JUnit 5 환경이 정상입니다");
    }

    @Test
    @DisplayName("기본 산술 연산이 정확하다")
    void basicArithmetic() {
        int result = 2 + 3;
        assertTrue(result == 5, "2 + 3 = 5");
    }
}
