package com.peakmate.backend.global.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 난이도 (공통).
 * 선곡/제작/파트 등 전 도메인에서 공통으로 사용하는 난이도 등급.
 * <p>
 * 저장 규칙:
 * - 모든 도메인(Production/WorkerGroup/Part 등)에서 EnumType.STRING으로 저장
 * - DB 저장값: HIGHEST, HIGH, MEDIUM, LOW (enum 이름 그대로)
 * - 프론트엔드에서도 동일한 영문 코드(HIGHEST 등)로 송수신
 * <p>
 * API 응답 형식: { code: "HIGH", description: "상" }
 * - code: enum name (영문)
 * - description: 한글 표시명
 */
@Getter
@RequiredArgsConstructor
public enum Difficulty {

    /** 극상 난이도 */
    HIGHEST("극상"),
    /** 상 난이도 */
    HIGH("상"),
    /** 중 난이도 */
    MEDIUM("중"),
    /** 하 난이도 */
    LOW("하");

    /** 화면 표시용 한글 설명 */
    private final String description;
}
