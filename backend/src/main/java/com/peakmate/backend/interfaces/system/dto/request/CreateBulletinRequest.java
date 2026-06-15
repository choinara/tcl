package com.peakmate.backend.interfaces.system.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBulletinRequest(
        @NotBlank(message = "제목은 필수입니다.")
        @Size(max = 200, message = "제목은 200자 이내여야 합니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        Boolean popupOnLogin,
        String validFrom,
        String validTo,
        Boolean active
) {}
