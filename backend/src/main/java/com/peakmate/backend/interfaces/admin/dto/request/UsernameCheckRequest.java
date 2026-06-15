package com.peakmate.backend.interfaces.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 아이디 중복확인 요청 DTO.
 */
public record UsernameCheckRequest(
        @NotBlank(message = "사용자명은 필수입니다")
        @Size(min = 4, max = 20, message = "사용자명은 4~20자여야 합니다")
        @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "사용자명은 영문, 숫자, _, -만 사용 가능합니다")
        String username) {
}
