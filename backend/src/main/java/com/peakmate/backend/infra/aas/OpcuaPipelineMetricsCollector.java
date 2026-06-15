package com.peakmate.backend.infra.aas;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * 파이프라인 인메모리 메트릭 수집기.
 * Edge별 수신 현황, TimescaleDB INSERT 처리량, BQueue 상태를 AA0090 대시보드에 제공.
 * DB 저장 없음. 조회 시 evict-on-read로 윈도우 유지.
 */
@Component
public class OpcuaPipelineMetricsCollector {

    private final OpcuaDataQueue dataQueue;
    private final ConcurrentHashMap<String, EdgeMetrics> edgeMetricsMap = new ConcurrentHashMap<>();
    private final ConcurrentLinkedDeque<InsertThroughput> insertThroughputs = new ConcurrentLinkedDeque<>();

    public OpcuaPipelineMetricsCollector(OpcuaDataQueue dataQueue) {
        this.dataQueue = dataQueue;
    }

    public void recordIngest(String edgeId, int pointCount) {
        Instant now = Instant.now();
        edgeMetricsMap.compute(edgeId, (k, existing) -> {
            EdgeMetrics m = (existing != null) ? existing : new EdgeMetrics();
            m.lastIngestAt = now;
            m.ingestTimestamps.addLast(now);
            return m;
        });
    }

    public void recordInsert(int batchSize) {
        insertThroughputs.addLast(new InsertThroughput(Instant.now(), batchSize));
    }

    public List<EdgeSnapshot> getEdgeSnapshots() {
        Instant now = Instant.now();
        Instant oneMinAgo = now.minusSeconds(60);
        Instant thirtySecAgo = now.minusSeconds(30);
        Instant fiveMinAgo = now.minusSeconds(300);

        List<EdgeSnapshot> result = new ArrayList<>();
        for (Map.Entry<String, EdgeMetrics> entry : edgeMetricsMap.entrySet()) {
            EdgeMetrics m = entry.getValue();
            m.ingestTimestamps.removeIf(t -> t.isBefore(oneMinAgo));

            Instant lastAt = m.lastIngestAt;
            String status;
            if (lastAt == null || lastAt.isBefore(fiveMinAgo)) {
                status = "NO_SIGNAL";
            } else if (lastAt.isBefore(thirtySecAgo)) {
                status = "DELAYED";
            } else {
                status = "NORMAL";
            }
            result.add(new EdgeSnapshot(entry.getKey(), lastAt, m.ingestTimestamps.size(), status));
        }
        return result;
    }

    public double getInsertTps5min() {
        Instant fiveMinAgo = Instant.now().minusSeconds(300);
        insertThroughputs.removeIf(t -> t.timestamp().isBefore(fiveMinAgo));

        int total = 0;
        for (InsertThroughput t : insertThroughputs) {
            total += t.count();
        }
        return total / 300.0;
    }

    public QueueMetrics getQueueMetrics() {
        return new QueueMetrics(dataQueue.size(), dataQueue.getCapacity(), dataQueue.isFull());
    }

    private static class EdgeMetrics {
        volatile Instant lastIngestAt;
        final ConcurrentLinkedDeque<Instant> ingestTimestamps = new ConcurrentLinkedDeque<>();
    }

    public record InsertThroughput(Instant timestamp, int count) {}

    public record EdgeSnapshot(String edgeId, Instant lastIngestAt, int recent1minCount, String status) {}

    public record QueueMetrics(int size, int capacity, boolean full) {}
}
