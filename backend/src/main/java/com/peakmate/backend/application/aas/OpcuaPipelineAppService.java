package com.peakmate.backend.application.aas;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.aas.OpcuaDataQueue;
import com.peakmate.backend.infra.aas.OpcuaPipelineMetricsCollector;
import com.peakmate.backend.infra.aas.OpcuaPointRecord;
import com.peakmate.backend.infra.aas.OpcuaTimescaleInsertService;
import com.peakmate.backend.infra.repository.aas.OpcuaBatchPendingJpaRepository;
import com.peakmate.core.error.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpcuaPipelineAppService {

    private final OpcuaDataQueue dataQueue;
    private final OpcuaPipelineMetricsCollector metricsCollector;
    private final OpcuaBatchPendingJpaRepository pendingRepository;
    private final ObjectMapper objectMapper;
    private final SystemLogService systemLogService;

    @Autowired(required = false)
    private RedisTemplate<String, String> redisTemplate;

    @Autowired(required = false)
    @Qualifier("timescaleJdbcTemplate")
    private JdbcTemplate timescaleJdbcTemplate;

    @Autowired(required = false)
    private OpcuaTimescaleInsertService insertService;

    @Transactional(readOnly = true)
    public PipelineStatusResult getStatus() {
        OpcuaPipelineMetricsCollector.QueueMetrics queue = metricsCollector.getQueueMetrics();
        double usagePercent = queue.capacity() > 0
                ? (double) queue.size() / queue.capacity() * 100.0
                : 0.0;

        String redisStatus = resolveRedisStatus();
        String tsdbStatus = resolveTimescaleStatus();
        double insertTps = metricsCollector.getInsertTps5min();

        Map<String, Long> counts = new HashMap<>();
        counts.put("PENDING", 0L);
        counts.put("DONE", 0L);
        counts.put("DEAD", 0L);
        for (Object[] row : pendingRepository.countByStatusGrouped()) {
            String status = (String) row[0];
            long count = ((Number) row[1]).longValue();
            if (counts.containsKey(status)) {
                counts.put(status, count);
            }
        }

        return new PipelineStatusResult(
                queue.size(), queue.capacity(), queue.full(), usagePercent,
                redisStatus, tsdbStatus, insertTps,
                counts.get("PENDING").intValue(), counts.get("DONE").intValue(), counts.get("DEAD").intValue()
        );
    }

    @Transactional(readOnly = true)
    public List<OpcuaPipelineMetricsCollector.EdgeSnapshot> getEdgeStatuses() {
        return metricsCollector.getEdgeSnapshots();
    }

    @Transactional(readOnly = true)
    public Page<OpcuaBatchPending> getPendingList(List<String> statuses, Pageable pageable) {
        return pendingRepository.findByStatusInOrderByCreatedAtDesc(statuses, pageable);
    }

    @Transactional
    public RetryResult retryPending(Long id) {
        String currentUser = getCurrentUser();

        OpcuaBatchPending pending = pendingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pending ID=" + id + " 없음"));

        if (!pending.getStatus().equals("PENDING") && !pending.getStatus().equals("DEAD")) {
            return new RetryResult(id, "FAILED", "재시도 불가능한 상태입니다: " + pending.getStatus());
        }
        if (pending.getRetryCount() >= 10) {
            return new RetryResult(id, "FAILED", "최대 재시도 횟수(10회)를 초과했습니다");
        }
        if (insertService == null) {
            return new RetryResult(id, "FAILED", "TimescaleDB 비활성 상태");
        }

        try {
            List<OpcuaPointRecord> batch = objectMapper.readValue(
                    pending.getBatchJson(), new TypeReference<>() {});
            insertService.insertBatchOnce(batch);
            pending.markDone();

            try {
                systemLogService.log("DATA_CHANGE", null, currentUser, null,
                        "PENDING 수동 재시도 성공", "id=" + id + ", retryCount=" + pending.getRetryCount());
            } catch (Exception e) {
                log.warn("[시스템 로그 기록 실패] PENDING 재시도 성공", e);
            }
            return new RetryResult(id, "SUCCESS", "재시도 성공");

        } catch (DataAccessException e) {
            pending.retryFailed(e.getMessage());
            try {
                systemLogService.log("DATA_CHANGE", null, currentUser, null,
                        "PENDING 수동 재시도 실패", "id=" + id + ", error=" + e.getMessage());
            } catch (Exception ex) {
                log.warn("[시스템 로그 기록 실패] PENDING 재시도 실패", ex);
            }
            return new RetryResult(id, "FAILED", e.getMessage());

        } catch (Exception e) {
            pending.retryFailed(e.getMessage());
            log.error("[PENDING 재시도] JSON 역직렬화 실패 id={}: {}", id, e.getMessage());
            return new RetryResult(id, "FAILED", "JSON 파싱 오류: " + e.getMessage());
        }
    }

    @Transactional
    public int deleteDeadPendings() {
        String currentUser = getCurrentUser();
        int deleted = pendingRepository.deleteAllDead();
        try {
            systemLogService.log("DATA_CHANGE", null, currentUser, null,
                    "DEAD 배치 일괄 삭제", "삭제 건수=" + deleted);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] DEAD 삭제", e);
        }
        return deleted;
    }

    private String resolveRedisStatus() {
        if (redisTemplate == null) return "NOT_CONFIGURED";
        try {
            Boolean hasKey = redisTemplate.hasKey("__pipeline_health_check__");
            return "CONNECTED";
        } catch (Exception e) {
            return "DISCONNECTED";
        }
    }

    private String resolveTimescaleStatus() {
        if (timescaleJdbcTemplate == null) return "NOT_CONFIGURED";
        try {
            timescaleJdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return "CONNECTED";
        } catch (Exception e) {
            return "DISCONNECTED";
        }
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    public record PipelineStatusResult(
            int queueSize, int queueCapacity, boolean queueFull, double queueUsagePercent,
            String redisStatus, String timescaledbStatus, double insertTps5min,
            int pendingCount, int doneCount, int deadCount
    ) {}

    public record RetryResult(long id, String result, String message) {}
}
