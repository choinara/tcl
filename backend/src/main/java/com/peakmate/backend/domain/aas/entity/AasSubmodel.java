package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAS Submodel 엔티티
 */
@Getter
@Entity
@Table(name = "aas_submodel")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AasSubmodel extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "shell_id", nullable = false)
    private Long shellId;

    @Column(name = "id_short", length = 255)
    private String idShort;

    @Column(name = "semantic_id", length = 500)
    private String semanticId;

    @Column(name = "element_count")
    private Integer elementCount;

    @Builder
    private AasSubmodel(Long shellId, String idShort, String semanticId,
                        Integer elementCount) {
        this.shellId = shellId;
        this.idShort = idShort;
        this.semanticId = semanticId;
        this.elementCount = elementCount;
    }

    public static AasSubmodel create(Long shellId, String idShort, String semanticId, int elementCount) {
        return AasSubmodel.builder()
                .shellId(shellId)
                .idShort(idShort)
                .semanticId(semanticId)
                .elementCount(elementCount)
                .build();
    }

    public void updateElementCount(int count) {
        this.elementCount = count;
    }
}
