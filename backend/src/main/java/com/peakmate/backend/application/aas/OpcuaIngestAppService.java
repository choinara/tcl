package com.peakmate.backend.application.aas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peakmate.backend.infra.aas.OpcuaDataQueue;
import com.peakmate.backend.infra.aas.OpcuaPipelineMetricsCollector;
import com.peakmate.backend.infra.aas.OpcuaPointRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * OPC-UA 데이터 수신 Application Service.
 * Redis SET(TTL 5분) + 내부 큐 enqueue 처리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpcuaIngestAppService {

    private final OpcuaDataQueue dataQueue;
    private final ObjectMapper objectMapper;
    private final OpcuaPipelineMetricsCollector metricsCollector;

    @Autowired(required = false)
    private RedisTemplate<String, String> redisTemplate;

    public IngestResult processBatch(String edgeId, List<DataPointItem> points) {
        int accepted = 0;
        int queued = 0;

        for (DataPointItem p : points) {
            // Redis: 최신값 저장 (TTL 5분)
            if (redisTemplate != null) {
                try {
                    String key = "opcua:" + edgeId + ":" + p.node_id();
                    String value = objectMapper.writeValueAsString(p);
                    redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(300));
                } catch (Exception e) {
                    log.warn("[Redis] SET 실패 node_id={}: {}", p.node_id(), e.getMessage());
                }
            }

            // 내부 큐 enqueue
            OpcuaPointRecord record = new OpcuaPointRecord(
                    edgeId, p.node_id(), p.value(), p.data_type(), p.quality(), p.collected_at());
            if (dataQueue.offer(record)) queued++;
            accepted++;
        }

        boolean queueFull = queued < accepted;
        metricsCollector.recordIngest(edgeId, points.size());
        return new IngestResult(accepted, queued, queueFull);
    }

    public record DataPointItem(
            String node_id,
            String value,
            String data_type,
            String quality,
            String collected_at
    ) {}

    public record IngestResult(int accepted, int queued, boolean queueFull) {}
}
