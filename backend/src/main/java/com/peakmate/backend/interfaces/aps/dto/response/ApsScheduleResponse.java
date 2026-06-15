package com.peakmate.backend.interfaces.aps.dto.response;

import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 배정 결과 응답 DTO.
 */
public record ApsScheduleResponse(
        Long draftId,
        String lineCode,
        LocalDate planDate,
        String shift,
        String crew,
        Integer workerCount,
        String productCode,
        BigDecimal plannedQty,
        BigDecimal taktTime,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer sortOrder,
        String remark
) {

    public static ApsScheduleResponse from(ApsScheduleDraft draft) {
        return new ApsScheduleResponse(
                draft.getId(),
                draft.getLineCode(),
                draft.getPlanDate(),
                draft.getShift(),
                draft.getCrew(),
                draft.getWorkerCount(),
                draft.getProductCode(),
                draft.getPlannedQty(),
                draft.getTaktTime(),
                draft.getStartTime(),
                draft.getEndTime(),
                draft.getSortOrder(),
                draft.getRemark()
        );
    }
}
