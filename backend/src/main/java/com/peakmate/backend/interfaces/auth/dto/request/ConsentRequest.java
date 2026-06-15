package com.peakmate.backend.interfaces.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConsentRequest(
        @NotBlank(message = "동의 유형은 필수입니다.")
        @Size(max = 50, message = "동의 유형은 50자 이내여야 합니다.")
        String consentType,

        @NotBlank(message = "동의 버전은 필수입니다.")
        @Size(max = 20, message = "동의 버전은 20자 이내여야 합니다.")
        String consentVersion,

        @NotNull(message = "동의 여부는 필수입니다.")
        Boolean consented
) {}
