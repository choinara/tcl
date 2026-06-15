package com.peakmate.backend.domain.notification.service;

import com.peakmate.backend.domain.notification.entity.SystemNotification;
import com.peakmate.backend.domain.notification.repository.SystemNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 시스템 공지 도메인 서비스.
 * 공지 조회 관련 도메인 로직을 담당합니다.
 */
@Service
@RequiredArgsConstructor
public class SystemNotificationDomainService {

    private final SystemNotificationRepository systemNotificationRepository;

    /**
     * 현재 시점에 활성화된 공지 목록을 반환합니다.
     * useYn='Y', startDate &lt;= now, endDate IS NULL OR endDate &gt;= now 조건을 만족하는 공지입니다.
     *
     * @return 활성 공지 목록
     */
    @Transactional(readOnly = true)
    public List<SystemNotification> getActiveNotifications() {
        return systemNotificationRepository.findActive();
    }
}
