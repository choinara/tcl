package com.peakmate.backend.infra.repository.notification;

import com.peakmate.backend.domain.notification.entity.SystemNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemNotificationJpaRepository extends JpaRepository<SystemNotification, Long> {

    Page<SystemNotification> findByUseYnOrderByCreatedAtDesc(String useYn, Pageable pageable);
}
