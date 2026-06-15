package com.peakmate.backend.domain.log.service;

import com.peakmate.backend.domain.log.entity.SystemLog;
import com.peakmate.backend.infra.repository.log.SystemLogJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemLogService {

    private final SystemLogJpaRepository systemLogJpaRepository;

    @Transactional
    public void log(String logType, Long userId, String username, String ipAddress, String action, String detail) {
        SystemLog log = SystemLog.create(logType, userId, username, ipAddress, action, detail);
        systemLogJpaRepository.save(log);
    }
}
