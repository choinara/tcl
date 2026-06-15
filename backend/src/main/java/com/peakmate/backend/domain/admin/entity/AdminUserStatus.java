package com.peakmate.backend.domain.admin.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 사용자의 상태를 관리하는 Enum
 */
@Getter
@RequiredArgsConstructor
public enum AdminUserStatus {
    PENDING("승인대기"),
    ACTIVE("활성"),
    INACTIVE("비활성"),
    TERMINATED("해지"),
    DELETED("삭제");

    private final String description;
}
