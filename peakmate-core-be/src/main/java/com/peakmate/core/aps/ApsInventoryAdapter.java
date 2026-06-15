package com.peakmate.core.aps;

import java.util.List;

/**
 * 재고 데이터 어댑터 인터페이스.
 * 프로젝트별 재고 도메인에 맞게 구현한다.
 */
public interface ApsInventoryAdapter {

    /**
     * 대상 호기에 대한 재고 스냅샷을 로드한다.
     *
     * @param lineCodes 대상 호기 코드 목록
     * @return 재고 스냅샷
     */
    InventorySnapshot loadInventory(List<String> lineCodes);
}
