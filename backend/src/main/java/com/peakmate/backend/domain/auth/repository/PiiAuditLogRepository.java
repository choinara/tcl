package com.peakmate.backend.domain.auth.repository;

import com.peakmate.backend.domain.auth.entity.PiiAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PiiAuditLogRepository extends JpaRepository<PiiAuditLog, Long> {
}
