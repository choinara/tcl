package com.peakmate.backend.interfaces.system.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserRequest(
        @Size(max = 100, message = "이름은 100자 이내여야 합니다.")
        String name,

        @Size(max = 200, message = "이메일은 200자 이내여야 합니다.")
        String email,

        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        List<String> roles
) {}
