package com.peakmate.backend.interfaces.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNotificationRequest(
        @NotBlank(message = "알림 내용은 필수입니다.")
        @Size(max = 200, message = "알림 내용은 200자 이내여야 합니다.")
        String message,

        Boolean active,

        String startAt,

        String endAt
) {}
