package com.peakmate.backend.interfaces.usertab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 개별 탭 항목 DTO.
 */
public record TabItemDto(
        @NotBlank @Size(max = 500) String path,
        @Size(max = 20) String menuCode,
        @Size(max = 200) String label
) {
}
