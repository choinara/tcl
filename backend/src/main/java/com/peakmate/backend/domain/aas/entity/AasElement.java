package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAS SubmodelElement 엔티티
 */
@Getter
@Entity
@Table(name = "aas_element")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AasElement extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "submodel_id", nullable = false)
    private Long submodelId;

    @Column(name = "element_type", length = 50)
    private String elementType;

    @Column(name = "element_path", length = 500)
    private String elementPath;

    @Column(name = "id_short", length = 255)
    private String idShort;

    @Column(name = "value_type", length = 50)
    private String valueType;

    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "min_value", length = 50)
    private String minValue;

    @Column(name = "max_value", length = 50)
    private String maxValue;

    @Column(name = "description_ko", columnDefinition = "TEXT")
    private String descriptionKo;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "semantic_id", length = 500)
    private String semanticId;

    @Builder
    private AasElement(Long submodelId, String elementType, String elementPath, String idShort,
                       String valueType, String value, String unit, String minValue, String maxValue,
                       String descriptionKo, String descriptionEn, String semanticId) {
        this.submodelId = submodelId;
        this.elementType = elementType;
        this.elementPath = elementPath;
        this.idShort = idShort;
        this.valueType = valueType;
        this.value = value;
        this.unit = unit;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.descriptionKo = descriptionKo;
        this.descriptionEn = descriptionEn;
        this.semanticId = semanticId;
    }

    public static AasElement create(Long submodelId, String elementType, String elementPath,
                                     String idShort, String valueType, String value, String unit,
                                     String descriptionKo, String descriptionEn, String semanticId) {
        return AasElement.builder()
                .submodelId(submodelId)
                .elementType(elementType != null ? elementType : "Property")
                .elementPath(elementPath)
                .idShort(idShort)
                .valueType(valueType)
                .value(value)
                .unit(unit)
                .descriptionKo(descriptionKo)
                .descriptionEn(descriptionEn)
                .semanticId(semanticId)
                .build();
    }
}
