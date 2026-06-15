package com.peakmate.backend.domain.admin.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TeamCodeConverter implements AttributeConverter<TeamCode, String> {

    @Override
    public String convertToDatabaseColumn(TeamCode attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public TeamCode convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TeamCode.fromCode(dbData);
    }
}
