package com.peakmate.backend.domain.admin.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class BankCodeConverter implements AttributeConverter<BankCode, String> {

    @Override
    public String convertToDatabaseColumn(BankCode attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public BankCode convertToEntityAttribute(String dbData) {
        return dbData == null ? null : BankCode.fromCode(dbData);
    }

}
