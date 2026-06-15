package com.peakmate.backend.interfaces.auth.controller;

import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.jwt.JwtTokenProvider;
import com.peakmate.backend.infra.session.SessionEventService;
import com.peakmate.backend.infra.session.SseTicketService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * SSE 기반 세션 이벤트 엔드포인트.
 * JWT를 URL에 노출하지 않고, 인증된 요청으로 단기 티켓을 발급받아 SSE 연결에 사용합니다.
 */
@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionEventController {

    private final SessionEventService sessionEventService;
    private final AdminUserRepository adminUserRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SseTicketService sseTicketService;

    /**
     * SSE 연결용 단기 티켓 발급 (인증 필요, 30초 유효, 1회용)
     */
    @PostMapping("/ticket")
    public ApiResponse<Map<String, String>> issueTicket(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            return ApiResponse.error("AUTH001", "인증이 필요합니다.");
        }
        String username = jwtTokenProvider.getUsername(token);
        Long userId = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
                .getId();
        String ticket = sseTicketService.issueTicket(userId);
        return ApiResponse.success(Map.of("ticket", ticket));
    }

    /**
     * SSE 이벤트 스트림 (티켓 기반 인증, EventSource 호환)
     */
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam("ticket") String ticket) {
        Long userId = sseTicketService.consumeTicket(ticket);
        if (userId == null) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new IllegalArgumentException("Invalid or expired ticket"));
            return emitter;
        }
        return sessionEventService.subscribe(userId);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
