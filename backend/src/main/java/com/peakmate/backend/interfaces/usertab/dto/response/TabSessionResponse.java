package com.peakmate.backend.interfaces.usertab.dto.response;

import com.peakmate.backend.interfaces.usertab.dto.request.TabItemDto;

import java.util.List;

/**
 * 탭 세션 조회 응답 DTO.
 */
public record TabSessionResponse(
        List<TabItemDto> tabs,
        String activePath
) {
}
