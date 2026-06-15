package com.peakmate.backend.infra.session;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE 기반 세션 이벤트 서비스.
 * 단일 로그인 모드에서 새 로그인 시 기존 세션에 강제 로그아웃 이벤트를 전송합니다.
 */
@Service
@Slf4j
public class SessionEventService {

    // userId → 해당 사용자의 SSE 연결 목록
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /**
     * SSE 연결 등록
     */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(0L); // 타임아웃 없음 (클라이언트가 관리)

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        // 연결 확인용 초기 이벤트
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.debug("[SSE] 세션 이벤트 구독: userId={}", userId);
        return emitter;
    }

    /**
     * 특정 사용자의 모든 SSE 연결에 강제 로그아웃 이벤트 전송.
     * 새 로그인의 토큰은 제외하기 위해 전송 후 모든 연결을 닫습니다.
     */
    public void sendForceLogout(Long userId, String message) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        log.info("[SSE] 강제 로그아웃 이벤트 전송: userId={}", userId);

        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("force-logout")
                        .data(message));
                emitter.complete();
            } catch (IOException e) {
                // 이미 끊긴 연결
            }
        }
        emitters.remove(userId);
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }
}
