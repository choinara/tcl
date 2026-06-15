package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

/**
 * Asset Type 엔티티 (자산 유형 정의)
 */
@Getter
@Entity
@Table(name = "asset_type")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssetType extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "type_code", nullable = false, length = 50, unique = true)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 255)
    private String typeName;

    @Column(name = "shell_id", length = 500)
    private String shellId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "field_schema", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, String>> fieldSchema;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Builder
    private AssetType(String typeCode, String typeName, String shellId, String description,
                      List<Map<String, String>> fieldSchema, String useYn) {
        this.typeCode = typeCode;
        this.typeName = typeName;
        this.shellId = shellId;
        this.description = description;
        this.fieldSchema = fieldSchema;
        this.useYn = useYn;
    }

    public static AssetType create(String typeCode, String typeName, String shellId,
                                    String description, List<Map<String, String>> fieldSchema) {
        return AssetType.builder()
                .typeCode(typeCode)
                .typeName(typeName)
                .shellId(shellId)
                .description(description)
                .fieldSchema(fieldSchema != null ? fieldSchema : List.of())
                .useYn("Y")
                .build();
    }

    public void update(String typeName, String shellId, String description,
                       List<Map<String, String>> fieldSchema) {
        this.typeName = typeName;
        this.shellId = shellId;
        this.description = description;
        this.fieldSchema = fieldSchema != null ? fieldSchema : this.fieldSchema;
    }
}
