package com.peakmate.backend.infra.repository.notification;

import com.peakmate.backend.domain.notification.entity.QSystemNotification;
import com.peakmate.backend.domain.notification.entity.SystemNotification;
import com.peakmate.backend.domain.notification.repository.SystemNotificationRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SystemNotificationRepositoryImpl implements SystemNotificationRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<SystemNotification> findActive() {
        QSystemNotification notification = QSystemNotification.systemNotification;
        LocalDateTime now = LocalDateTime.now();

        return queryFactory
                .selectFrom(notification)
                .where(
                        notification.useYn.eq("Y"),
                        notification.startDate.loe(now),
                        notification.endDate.isNull()
                                .or(notification.endDate.goe(now))
                )
                .orderBy(notification.startDate.desc())
                .fetch();
    }
}
