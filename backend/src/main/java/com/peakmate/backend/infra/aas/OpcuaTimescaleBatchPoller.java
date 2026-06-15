package com.peakmate.backend.infra.aas;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 5초 주기 TimescaleDB batch INSERT 폴러.
 * fixedDelay 단독 사용 — @Async 제거로 동시 실행 방지 (Rule 8-2).
 * @Retryable은 OpcuaTimescaleInsertService에 분리.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "peakmate.timescaledb.enabled", havingValue = "true")
@RequiredArgsConstructor
public class OpcuaTimescaleBatchPoller {

    private static final int BATCH_SIZE = 70_000;

    private final OpcuaDataQueue dataQueue;
    private final OpcuaTimescaleInsertService insertService;

    @Scheduled(fixedDelay = 5_000)
    public void poll() {
        List<OpcuaPointRecord> batch = new ArrayList<>();
        int drained = dataQueue.drainTo(batch, BATCH_SIZE);
        if (drained == 0) return;

        log.debug("[폴러] 큐에서 {} 건 drain -> TimescaleDB INSERT 시작", drained);
        insertService.insertBatch(batch);
    }
}
