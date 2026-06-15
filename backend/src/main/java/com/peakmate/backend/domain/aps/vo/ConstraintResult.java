package com.peakmate.backend.domain.aps.vo;

import com.peakmate.core.aps.DemandItem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 제약 검증 결과 VO (DB 비저장).
 *
 * @param feasibleDemands     실행 가능 수요 목록
 * @param unmetDemands        미충족 수요 목록 (사유 포함)
 * @param warnings            경고 목록
 * @param capacityUtilization 호기별 부하율 (%)
 */
public record ConstraintResult(
        List<DemandItem> feasibleDemands,
        List<UnmetDemand> unmetDemands,
        List<String> warnings,
        Map<String, BigDecimal> capacityUtilization
) {}
