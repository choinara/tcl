package com.peakmate.backend.global.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 우선순위 (공통).
 * 선곡/제작/작업자그룹 등에서 공통으로 사용.
 * <p>
 * DB 저장: EnumType.STRING (LOW, NORMAL, HIGH, URGENT, CUSTOM_ORDER)
 * API 응답: { code: "HIGH", description: "높음" }
 */
@Getter
@RequiredArgsConstructor
public enum Priority {

    LOW("낮음"),
    NORMAL("보통"),
    HIGH("높음"),
    URGENT("긴급"),
    CUSTOM_ORDER("주문제작");

    /** 화면 표시용 한글 설명 */
    private final String description;
}
