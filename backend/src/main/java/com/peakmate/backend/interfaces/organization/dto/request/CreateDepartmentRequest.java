package com.peakmate.backend.interfaces.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDepartmentRequest(
        @NotBlank(message = "부서코드는 필수입니다.")
        @Size(max = 50, message = "부서코드는 50자 이내여야 합니다.")
        String deptCode,

        @NotBlank(message = "부서명은 필수입니다.")
        @Size(max = 100, message = "부서명은 100자 이내여야 합니다.")
        String deptName,

        Long companyId,

        Long parentId,

        Integer deptLevel,

        Integer sortOrder,

        @Size(max = 100)
        String managerName,

        @Size(max = 30)
        String phone,

        @Size(max = 200)
        String location
) {}
