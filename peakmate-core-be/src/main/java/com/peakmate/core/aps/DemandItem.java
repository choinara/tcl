package com.peakmate.core.aps;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 수요 단위 VO (DB 비저장).
 *
 * @param productCode  제품 코드
 * @param customerCode 고객사 코드
 * @param dueDate      납기일
 * @param demandQty    요청 수량 (kg)
 * @param rtfQty       RTF 수량 (출하 가능 수량)
 * @param priority     우선순위 (낮을수록 높음)
 */
public record DemandItem(
        String productCode,
        String customerCode,
        LocalDate dueDate,
        BigDecimal demandQty,
        BigDecimal rtfQty,
        int priority
) {}
