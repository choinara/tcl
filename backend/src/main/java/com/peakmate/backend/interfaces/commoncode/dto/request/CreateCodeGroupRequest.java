package com.peakmate.backend.interfaces.commoncode.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCodeGroupRequest(
        @NotBlank(message = "그룹코드는 필수입니다.")
        @Size(max = 50, message = "그룹코드는 50자 이내여야 합니다.")
        @Pattern(regexp = "^[A-Z0-9_]+$", message = "그룹코드는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.")
        String groupCode,

        @NotBlank(message = "그룹명은 필수입니다.")
        @Size(max = 200, message = "그룹명은 200자 이내여야 합니다.")
        String groupName,

        @Size(max = 500, message = "설명은 500자 이내여야 합니다.")
        String description,

        Integer sortOrder,

        @Size(max = 100, message = "Extra1 라벨은 100자 이내여야 합니다.")
        String extra1Label,

        @Size(max = 100, message = "Extra2 라벨은 100자 이내여야 합니다.")
        String extra2Label
) {}
