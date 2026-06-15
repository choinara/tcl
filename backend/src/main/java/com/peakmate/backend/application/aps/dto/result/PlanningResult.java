package com.peakmate.backend.application.aps.dto.result;

import com.peakmate.backend.domain.aps.entity.ApsScheduleDraft;
import com.peakmate.backend.domain.aps.vo.ConstraintResult;

import java.util.List;

/**
 * 계획 실행 결과.
 *
 * @param planId           생성된 계획 ID
 * @param schedules        배정 결과 리스트
 * @param constraintResult 제약 검증 결과
 */
public record PlanningResult(
        Long planId,
        List<ApsScheduleDraft> schedules,
        ConstraintResult constraintResult
) {}
