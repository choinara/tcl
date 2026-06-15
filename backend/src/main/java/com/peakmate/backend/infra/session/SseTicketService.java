package com.peakmate.backend.infra.session;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SSE 연결을 위한 단기 티켓 발급 서비스.
 * JWT를 URL 쿼리 파라미터에 직접 노출하지 않고,
 * 인증된 사용자에게 30초 유효한 1회용 티켓을 발급합니다.
 */
@Service
public class SseTicketService {

    private static final long TICKET_TTL_MS = 30_000; // 30초
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConcurrentHashMap<String, TicketInfo> tickets = new ConcurrentHashMap<>();

    public String issueTicket(Long userId) {
        cleanup();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String ticket = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tickets.put(ticket, new TicketInfo(userId, System.currentTimeMillis() + TICKET_TTL_MS));
        return ticket;
    }

    /**
     * 티켓을 검증하고 소비합니다 (1회용).
     * 유효하면 userId를 반환, 아니면 null.
     */
    public Long consumeTicket(String ticket) {
        if (ticket == null) return null;
        TicketInfo info = tickets.remove(ticket);
        if (info == null || System.currentTimeMillis() > info.expiresAt) {
            return null;
        }
        return info.userId;
    }

    private void cleanup() {
        long now = System.currentTimeMillis();
        tickets.entrySet().removeIf(e -> now > e.getValue().expiresAt);
    }

    private record TicketInfo(Long userId, long expiresAt) {}
}
