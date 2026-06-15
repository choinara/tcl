package com.peakmate.backend.infra.aas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import com.peakmate.backend.infra.repository.aas.OpcuaBatchPendingJpaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

/**
 * TimescaleDB batch INSERT -- @Retryable 전담 (Rule 8-2: @Async와 분리).
 * 3회 재시도 실패 시 @Recover -> opcua_batch_pending 테이블에 JSON 저장.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "peakmate.timescaledb.enabled", havingValue = "true")
public class OpcuaTimescaleInsertService {

    private final JdbcTemplate timescaleJdbcTemplate;
    private final OpcuaBatchPendingJpaRepository pendingRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private OpcuaPipelineMetricsCollector metricsCollector;

    public OpcuaTimescaleInsertService(
            @Qualifier("timescaleJdbcTemplate") JdbcTemplate timescaleJdbcTemplate,
            OpcuaBatchPendingJpaRepository pendingRepository,
            ObjectMapper objectMapper) {
        this.timescaleJdbcTemplate = timescaleJdbcTemplate;
        this.pendingRepository = pendingRepository;
        this.objectMapper = objectMapper;
    }

    private static final String INSERT_SQL =
            "INSERT INTO opcua_ingest_log (edge_id, node_id, value, data_type, quality, collected_at) " +
            "VALUES (?, ?, ?, ?, ?, ?)";

    @Retryable(retryFor = DataAccessException.class,
               maxAttempts = 3,
               backoff = @Backoff(delay = 2000, multiplier = 2))
    public void insertBatch(List<OpcuaPointRecord> batch) {
        List<Object[]> args = batch.stream()
                .map(r -> new Object[]{
                        r.edgeId(), r.nodeId(), r.value(), r.dataType(), r.quality(),
                        parseTimestamp(r.collectedAt())
                })
                .toList();
        timescaleJdbcTemplate.batchUpdate(INSERT_SQL, args);
        log.debug("[TimescaleDB] batch INSERT {} 건 완료", batch.size());
        if (metricsCollector != null) metricsCollector.recordInsert(batch.size());
    }

    /**
     * @Retryable 없는 1회 시도 메서드. AA0090 수동 재시도 전용.
     * 실패 시 DataAccessException을 그대로 throw (중복 PENDING 생성 방지).
     */
    public void insertBatchOnce(List<OpcuaPointRecord> batch) {
        List<Object[]> args = batch.stream()
                .map(r -> new Object[]{
                        r.edgeId(), r.nodeId(), r.value(), r.dataType(), r.quality(),
                        parseTimestamp(r.collectedAt())
                })
                .toList();
        timescaleJdbcTemplate.batchUpdate(INSERT_SQL, args);
        log.debug("[TimescaleDB] insertBatchOnce {} 건 완료", batch.size());
        if (metricsCollector != null) metricsCollector.recordInsert(batch.size());
    }

    @Recover
    @Transactional
    public void recoverInsertBatch(DataAccessException ex, List<OpcuaPointRecord> batch) {
        log.error("[TimescaleDB] 3회 재시도 모두 실패 -- PENDING 저장 {} 건: {}", batch.size(), ex.getMessage());
        try {
            String json = objectMapper.writeValueAsString(batch);
            pendingRepository.save(OpcuaBatchPending.create(json, ex.getMessage()));
        } catch (Exception e) {
            log.error("[TimescaleDB] PENDING 저장 실패: {}", e.getMessage());
        }
    }

    private Timestamp parseTimestamp(String collectedAt) {
        try {
            return Timestamp.from(Instant.parse(collectedAt));
        } catch (Exception e) {
            return new Timestamp(System.currentTimeMillis());
        }
    }
}
