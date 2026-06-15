package com.peakmate.backend.domain.aps.vo;

import com.peakmate.core.aps.DemandItem;

/**
 * 미충족 수요 VO.
 *
 * @param demand 원본 수요
 * @param reason 미충족 사유 코드 (capacity_exceeded, min_worker_not_met, no_takt_time 등)
 * @param detail 상세 메시지
 */
public record UnmetDemand(
        DemandItem demand,
        String reason,
        String detail
) {}
