package com.peakmate.backend.interfaces.commoncode.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCodeRequest(
        @NotNull(message = "그룹ID는 필수입니다.")
        Long groupId,

        @NotBlank(message = "코드는 필수입니다.")
        @Size(max = 50, message = "코드는 50자 이내여야 합니다.")
        @Pattern(regexp = "^[A-Z0-9_]+$", message = "코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.")
        String code,

        @NotBlank(message = "코드명은 필수입니다.")
        @Size(max = 200, message = "코드명은 200자 이내여야 합니다.")
        String codeName,

        @Size(max = 500, message = "코드설명은 500자 이내여야 합니다.")
        String codeDesc,

        Integer sortOrder,

        @Size(max = 500)
        String extra1,

        @Size(max = 500)
        String extra2
) {}
