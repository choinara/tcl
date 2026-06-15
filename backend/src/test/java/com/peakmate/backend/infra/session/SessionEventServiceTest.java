package com.peakmate.backend.infra.session;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SessionEventService 단위 테스트.
 */
class SessionEventServiceTest {

    private final SessionEventService service = new SessionEventService();

    @Test
    @DisplayName("subscribe - SSE Emitter를 반환한다")
    void subscribe_returnsEmitter() {
        SseEmitter emitter = service.subscribe(1L);
        assertThat(emitter).isNotNull();
    }

    @Test
    @DisplayName("sendForceLogout - 구독자가 없으면 예외 없이 무시한다")
    void sendForceLogout_noSubscribers_doesNotThrow() {
        // 구독자 없는 사용자에게 전송해도 예외 없음
        service.sendForceLogout(999L, "test");
    }

    @Test
    @DisplayName("sendForceLogout - 구독자에게 이벤트 전송 후 연결이 정리된다")
    void sendForceLogout_sendsEventAndCleansUp() {
        Long userId = 1L;
        SseEmitter emitter = service.subscribe(userId);
        assertThat(emitter).isNotNull();

        // force-logout 전송 (emitter가 complete됨)
        service.sendForceLogout(userId, "다른 기기에서 로그인");

        // 동일 사용자로 재구독하면 새 emitter 반환 (기존 연결 정리 확인)
        SseEmitter newEmitter = service.subscribe(userId);
        assertThat(newEmitter).isNotNull();
        assertThat(newEmitter).isNotSameAs(emitter);
    }
}
