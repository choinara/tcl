package com.peakmate.backend.infra.aas;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * OPC-UA 수집 데이터 내부 큐.
 * 최대 200,000건 용량. 큐 포화 시 offer() false 반환 -> 503 응답.
 */
@Component
public class OpcuaDataQueue {

    private static final int MAX_CAPACITY = 200_000;
    private final LinkedBlockingQueue<OpcuaPointRecord> queue = new LinkedBlockingQueue<>(MAX_CAPACITY);

    public boolean offer(OpcuaPointRecord record) {
        return queue.offer(record);
    }

    public int drainTo(List<OpcuaPointRecord> target, int maxElements) {
        return queue.drainTo(target, maxElements);
    }

    public int size() {
        return queue.size();
    }

    public boolean isFull() {
        return queue.remainingCapacity() == 0;
    }

    public int getCapacity() {
        return MAX_CAPACITY;
    }
}
