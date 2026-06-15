package com.peakmate.backend.global.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Boolean ↔ Y/N 문자열 변환 컨버터
 * - DB: CHAR(1) 'Y' 또는 'N'
 * - Entity: Boolean true 또는 false
 */
@Converter
public class BooleanYNConverter implements AttributeConverter<Boolean, String> {

    @Override
    public String convertToDatabaseColumn(Boolean attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute ? "Y" : "N";
    }

    @Override
    public Boolean convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return "Y".equalsIgnoreCase(dbData);
    }
}
