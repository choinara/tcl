package com.peakmate.backend.interfaces.system.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest(
        @NotBlank(message = "역할코드는 필수입니다.")
        @Size(max = 50, message = "역할코드는 50자 이내여야 합니다.")
        String roleCode,

        @NotBlank(message = "역할명은 필수입니다.")
        @Size(max = 100, message = "역할명은 100자 이내여야 합니다.")
        String roleName,

        @Size(max = 500, message = "설명은 500자 이내여야 합니다.")
        String description
) {}
