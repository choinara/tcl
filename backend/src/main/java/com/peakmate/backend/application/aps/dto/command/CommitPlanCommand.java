package com.peakmate.backend.application.aps.dto.command;

/**
 * 계획 확정 Command.
 *
 * @param planId 계획 ID
 */
public record CommitPlanCommand(
        Long planId
) {}
