package com.peakmate.backend.global.common;

/**
 * Enum 필드의 code/description 쌍을 표현하는 공통 DTO.
 * <p>
 * 모든 Response/Result DTO에서 enum 값을 프론트엔드에 전달할 때 사용한다.
 * {@code { "code": "ENUM_NAME", "description": "한글설명" }}
 */
public record CodeOption(String code, String description) {}
