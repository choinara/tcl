package com.peakmate.backend.interfaces.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
        @NotBlank(message = "회사코드는 필수입니다.")
        @Size(max = 50, message = "회사코드는 50자 이내여야 합니다.")
        String companyCode,

        @NotBlank(message = "회사명은 필수입니다.")
        @Size(max = 200, message = "회사명은 200자 이내여야 합니다.")
        String companyName,

        @NotBlank(message = "사업자번호는 필수입니다.")
        @Size(max = 30, message = "사업자번호는 30자 이내여야 합니다.")
        String businessNumber,

        @Size(max = 50)
        String companyType,

        Long parentId,

        @Size(max = 50)
        String country,

        @Size(max = 500)
        String address,

        @Size(max = 30)
        String phone,

        @Size(max = 30)
        String fax,

        @Size(max = 100)
        String ceoName
) {}
