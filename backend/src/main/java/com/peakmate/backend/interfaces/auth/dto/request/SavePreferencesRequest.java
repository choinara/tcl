package com.peakmate.backend.interfaces.auth.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record SavePreferencesRequest(
        @NotNull(message = "환경설정 데이터는 필수입니다.")
        Map<String, String> preferences
) {}
