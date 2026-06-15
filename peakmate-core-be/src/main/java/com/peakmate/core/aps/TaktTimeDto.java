package com.peakmate.core.aps;

import java.math.BigDecimal;

/**
 * Takt time DTO.
 *
 * @param lineCode          호기 코드
 * @param productCode       제품 코드
 * @param taktTimeMinPerKg  단위 중량당 소요 시간 (분/kg)
 * @param minWorkerCount    최소 작업자 수
 */
public record TaktTimeDto(
        String lineCode,
        String productCode,
        BigDecimal taktTimeMinPerKg,
        int minWorkerCount
) {}
