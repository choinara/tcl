package com.peakmate.backend.interfaces.aps.dto.response;

import com.peakmate.backend.domain.aps.entity.ApsPlan;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 계획 응답 DTO.
 */
public record ApsPlanResponse(
        Long planId,
        LocalDate periodStart,
        LocalDate periodEnd,
        String lineCodes,
        String status,
        long scheduleCount,
        ConstraintResultResponse constraintResult,
        LocalDateTime createdAt,
        String createdBy
) {

    public static ApsPlanResponse from(ApsPlan plan, long scheduleCount, ConstraintResultResponse constraintResult) {
        return new ApsPlanResponse(
                plan.getId(),
                plan.getPeriodStart(),
                plan.getPeriodEnd(),
                plan.getLineCodes(),
                plan.getStatus(),
                scheduleCount,
                constraintResult,
                plan.getCreatedAt(),
                plan.getCreatedBy()
        );
    }
}
