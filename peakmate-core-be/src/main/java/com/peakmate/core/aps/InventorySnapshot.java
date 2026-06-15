package com.peakmate.core.aps;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 재고 스냅샷 VO (DB 비저장).
 *
 * @param availableByProduct 제품코드별 가용 재고 수량 (kg)
 */
public record InventorySnapshot(
        Map<String, BigDecimal> availableByProduct
) {

    /**
     * 특정 제품의 가용 재고 수량을 반환한다.
     *
     * @param productCode 제품 코드
     * @return 가용 재고 수량. 등록되지 않은 제품은 0.
     */
    public BigDecimal getAvailable(String productCode) {
        return availableByProduct.getOrDefault(productCode, BigDecimal.ZERO);
    }
}
