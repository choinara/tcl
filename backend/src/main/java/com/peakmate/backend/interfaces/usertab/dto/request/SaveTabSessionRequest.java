package com.peakmate.backend.interfaces.usertab.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 탭 세션 일괄 저장 요청 DTO.
 */
public record SaveTabSessionRequest(
        @NotNull @Valid List<TabItemDto> tabs,
        String activePath
) {
}
