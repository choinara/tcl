package com.peakmate.backend.domain.aps.service;

import com.peakmate.core.aps.ApsInventoryAdapter;
import com.peakmate.core.aps.InventorySnapshot;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 기본 재고 어댑터 (stub).
 * 재고 도메인이 미구현 상태이므로 빈 InventorySnapshot을 반환한다.
 * 재고 도메인 구현 후 실제 기초재고 로드로 교체한다.
 */
@Component
public class ApsDefaultInventoryAdapter implements ApsInventoryAdapter {

    @Override
    public InventorySnapshot loadInventory(List<String> lineCodes) {
        // 재고 도메인 구현 후 실제 기초재고 조회로 교체
        return new InventorySnapshot(Map.of());
    }
}
