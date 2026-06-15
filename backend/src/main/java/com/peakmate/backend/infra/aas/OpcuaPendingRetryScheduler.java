package com.peakmate.backend.infra.aas;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.aas.OpcuaBatchPendingJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 3분 주기 PENDING 배치 재시도 스케줄러.
 * 24시간 초과 항목은 DEAD 처리 + SystemLog 기록.
 * 매일 04:30 DEAD 항목 7일 초과분 자동 정리.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "peakmate.timescaledb.enabled", havingValue = "true")
@RequiredArgsConstructor
public class OpcuaPendingRetryScheduler {

    private final OpcuaBatchPendingJpaRepository pendingRepository;
    private final OpcuaTimescaleInsertService insertService;
    private final ObjectMapper objectMapper;
    private final SystemLogService systemLogService;

    @Scheduled(fixedDelay = 180_000)
    @Transactional
    public void retry() {
        List<OpcuaBatchPending> pendings = pendingRepository.findTop50ByStatusOrderByCreatedAtAsc("PENDING");
        if (pendings.isEmpty()) return;

        log.info("[PENDING 재시도] {} 건", pendings.size());

        LocalDateTime deadLine = LocalDateTime.now().minusHours(24);

        for (OpcuaBatchPending pending : pendings) {
            if (pending.getCreatedAt().isBefore(deadLine)) {
                pending.markDead();
                log.error("[DEAD] batchId={} 24h 초과 영구 실패", pending.getId());
                try {
                    systemLogService.log(
                            "SYSTEM_ERROR", null, "SYSTEM", null,
                            "opcua_failed_batch DEAD",
                            "id=" + pending.getId() + " retryCount=" + pending.getRetryCount());
                } catch (Exception ex) {
                    log.warn("[SystemLog] DEAD 기록 실패: {}", ex.getMessage());
                }
                continue;
            }
            try {
                List<OpcuaPointRecord> batch = objectMapper.readValue(
                        pending.getBatchJson(), new TypeReference<>() {});
                insertService.insertBatchOnce(batch);
                pending.markDone();
                log.info("[DONE] PENDING id={} 재INSERT 성공", pending.getId());
            } catch (Exception e) {
                pending.retryFailed(e.getMessage());
                log.warn("[재시도 실패] PENDING id={}: {}", pending.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 30 4 * * *")
    @Transactional
    public void purgeDeadBatches() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        int deleted = pendingRepository.deleteByStatusAndUpdatedAtBefore("DEAD", cutoff);
        if (deleted > 0) {
            log.info("[DEAD 정리] 7일 초과 {} 건 삭제", deleted);
        }
    }
}
