package com.peakmate.backend.application.aps.dto.command;

import java.math.BigDecimal;
import java.util.List;

/**
 * 수동 조정 Command.
 *
 * @param planId      계획 ID
 * @param adjustments 조정 항목 리스트
 */
public record AdjustPlanCommand(
        Long planId,
        List<AdjustmentItem> adjustments
) {

    /**
     * 개별 조정 항목.
     */
    public record AdjustmentItem(
            Long draftId,
            BigDecimal plannedQty,
            String lineCode,
            String shift,
            String crew,
            Integer workerCount,
            String remark
    ) {}
}
