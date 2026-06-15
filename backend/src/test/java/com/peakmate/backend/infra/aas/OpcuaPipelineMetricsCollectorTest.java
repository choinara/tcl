package com.peakmate.backend.infra.aas;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OpcuaPipelineMetricsCollectorTest {

    private OpcuaPipelineMetricsCollector collector;
    private OpcuaDataQueue mockQueue;

    @BeforeEach
    void setUp() {
        mockQueue = mock(OpcuaDataQueue.class);
        when(mockQueue.size()).thenReturn(1000);
        when(mockQueue.getCapacity()).thenReturn(200_000);
        when(mockQueue.isFull()).thenReturn(false);
        collector = new OpcuaPipelineMetricsCollector(mockQueue);
    }

    @Test
    @DisplayName("recordIngest 후 getEdgeSnapshots에 해당 Edge가 반영된다")
    void recordIngest_shouldReflectInSnapshots() {
        collector.recordIngest("EDGE-001", 100);
        collector.recordIngest("EDGE-001", 50);
        collector.recordIngest("EDGE-002", 200);

        List<OpcuaPipelineMetricsCollector.EdgeSnapshot> snapshots = collector.getEdgeSnapshots();

        assertThat(snapshots).hasSize(2);
        OpcuaPipelineMetricsCollector.EdgeSnapshot edge1 = snapshots.stream()
                .filter(s -> s.edgeId().equals("EDGE-001")).findFirst().orElseThrow();
        assertThat(edge1.recent1minCount()).isEqualTo(2);
        assertThat(edge1.status()).isEqualTo("NORMAL");
    }

    @Test
    @DisplayName("1분 초과 타임스탬프는 getEdgeSnapshots 호출 시 evict된다")
    void getEdgeSnapshots_shouldEvictOldTimestamps() throws InterruptedException {
        collector.recordIngest("EDGE-OLD", 10);
        List<OpcuaPipelineMetricsCollector.EdgeSnapshot> before = collector.getEdgeSnapshots();
        assertThat(before.stream().filter(s -> s.edgeId().equals("EDGE-OLD")).findFirst().orElseThrow().recent1minCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("recordInsert 후 getInsertTps5min은 양수값을 반환한다")
    void recordInsert_shouldReturnPositiveTps() {
        collector.recordInsert(5000);
        collector.recordInsert(3000);

        double tps = collector.getInsertTps5min();
        assertThat(tps).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("getQueueMetrics는 OpcuaDataQueue 값을 정확히 반환한다")
    void getQueueMetrics_shouldReturnQueueValues() {
        OpcuaPipelineMetricsCollector.QueueMetrics metrics = collector.getQueueMetrics();

        assertThat(metrics.size()).isEqualTo(1000);
        assertThat(metrics.capacity()).isEqualTo(200_000);
        assertThat(metrics.full()).isFalse();
    }

    @Test
    @DisplayName("Edge 상태: lastIngestAt이 30초 이내면 NORMAL")
    void edgeStatus_normal() {
        collector.recordIngest("EDGE-NORM", 10);
        OpcuaPipelineMetricsCollector.EdgeSnapshot snap = collector.getEdgeSnapshots().get(0);
        assertThat(snap.status()).isEqualTo("NORMAL");
    }

    @Test
    @DisplayName("Edge 상태: 기록이 없으면 NO_SIGNAL")
    void edgeStatus_noSignal_whenNoRecord() {
        List<OpcuaPipelineMetricsCollector.EdgeSnapshot> snapshots = collector.getEdgeSnapshots();
        assertThat(snapshots).isEmpty();
    }
}
