package com.peakmate.core.aps;

/**
 * 제약 위반 결과 DTO.
 *
 * @param constraintType 제약 유형
 * @param lineCode       위반 호기
 * @param productCode    위반 제품
 * @param messageKey     i18n 키 (예: "aps.constraint.bath_expired")
 * @param detailMessage  폴백 메시지
 */
public record ConstraintViolation(
        String constraintType,
        String lineCode,
        String productCode,
        String messageKey,
        String detailMessage
) {}
