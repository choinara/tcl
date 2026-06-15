package com.peakmate.backend.interfaces.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record MfaCodeRequest(
        @NotBlank(message = "OTP 코드는 필수입니다.")
        String code
) {}
