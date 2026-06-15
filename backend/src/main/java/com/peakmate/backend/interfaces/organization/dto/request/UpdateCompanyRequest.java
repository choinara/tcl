package com.peakmate.backend.interfaces.organization.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateCompanyRequest(
        @Size(max = 200, message = "회사명은 200자 이내여야 합니다.")
        String companyName,

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
        String ceoName,

        @Size(max = 30)
        String businessNumber,

        Boolean isActive
) {}
