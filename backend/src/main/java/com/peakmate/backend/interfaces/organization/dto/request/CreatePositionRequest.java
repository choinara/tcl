package com.peakmate.backend.interfaces.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePositionRequest(
        @NotBlank(message = "직급코드는 필수입니다.")
        @Size(max = 50, message = "직급코드는 50자 이내여야 합니다.")
        String positionCode,

        @NotBlank(message = "직급명은 필수입니다.")
        @Size(max = 100, message = "직급명은 100자 이내여야 합니다.")
        String positionName,

        Integer positionLevel,

        Integer sortOrder
) {}
