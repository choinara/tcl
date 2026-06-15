package com.peakmate.backend.interfaces.aps.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

/**
 * 수동 조정 요청 DTO.
 */
public record AdjustPlanRequest(
        @NotEmpty(message = "조정 항목이 비어 있습니다.")
        List<AdjustmentItem> adjustments
) {

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
