package com.peakmate.backend.application.aps.dto.command;

import java.time.LocalDate;
import java.util.List;

/**
 * 계획 실행 Command.
 *
 * @param periodStart 계획 시작일
 * @param periodEnd   계획 종료일
 * @param lineCodes   대상 호기 코드 목록
 */
public record RunPlanningCommand(
        LocalDate periodStart,
        LocalDate periodEnd,
        List<String> lineCodes
) {}
