package com.peakmate.backend.domain.notification.repository;

import com.peakmate.backend.domain.notification.entity.SystemNotification;

import java.util.List;

/**
 * SystemNotification Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface SystemNotificationRepository {

    /**
     * 현재 시점에 활성화된 공지 목록을 조회합니다.
     *
     * <p>조건:
     * <ul>
     *   <li>useYn = 'Y'</li>
     *   <li>startDate &lt;= now()</li>
     *   <li>endDate IS NULL OR endDate &gt;= now()</li>
     * </ul>
     *
     * @return 활성 공지 목록
     */
    List<SystemNotification> findActive();
}
