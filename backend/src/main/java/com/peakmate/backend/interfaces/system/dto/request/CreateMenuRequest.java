package com.peakmate.backend.interfaces.system.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMenuRequest(
        @NotBlank(message = "메뉴코드는 필수입니다.")
        @Size(max = 50, message = "메뉴코드는 50자 이내여야 합니다.")
        String menuCode,

        @NotBlank(message = "메뉴명은 필수입니다.")
        @Size(max = 200, message = "메뉴명은 200자 이내여야 합니다.")
        String menuName,

        @Size(max = 500, message = "메뉴경로는 500자 이내여야 합니다.")
        String menuPath,

        Long parentId,

        Integer sortOrder,

        @Size(max = 100, message = "아이콘은 100자 이내여야 합니다.")
        String icon,

        Boolean visible
) {}
