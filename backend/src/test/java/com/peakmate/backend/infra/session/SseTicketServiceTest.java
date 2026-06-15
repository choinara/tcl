package com.peakmate.backend.infra.session;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SseTicketService 단위 테스트.
 */
class SseTicketServiceTest {

    private final SseTicketService service = new SseTicketService();

    @Test
    @DisplayName("issueTicket - 고유한 티켓을 발급한다")
    void issueTicket_returnsUniqueTicket() {
        String ticket1 = service.issueTicket(1L);
        String ticket2 = service.issueTicket(1L);
        assertThat(ticket1).isNotBlank();
        assertThat(ticket2).isNotBlank();
        assertThat(ticket1).isNotEqualTo(ticket2);
    }

    @Test
    @DisplayName("consumeTicket - 유효한 티켓은 userId를 반환하고 소비된다")
    void consumeTicket_validTicket_returnsUserIdOnce() {
        String ticket = service.issueTicket(42L);
        Long userId = service.consumeTicket(ticket);
        assertThat(userId).isEqualTo(42L);

        // 1회용: 두 번째 사용 시 null
        Long second = service.consumeTicket(ticket);
        assertThat(second).isNull();
    }

    @Test
    @DisplayName("consumeTicket - 존재하지 않는 티켓은 null을 반환한다")
    void consumeTicket_invalidTicket_returnsNull() {
        assertThat(service.consumeTicket("nonexistent")).isNull();
    }

    @Test
    @DisplayName("consumeTicket - null 입력은 null을 반환한다")
    void consumeTicket_null_returnsNull() {
        assertThat(service.consumeTicket(null)).isNull();
    }
}
