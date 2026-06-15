package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AAS 연계 엔티티: OPC-UA DataPoint ↔ AAS Element 매핑
 */
@Getter
@Entity
@Table(name = "aas_linkage")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AasLinkage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "node_id", nullable = false, length = 100, unique = true)
    private String nodeId;

    @Column(name = "element_id", nullable = false)
    private Long elementId;

    @Column(name = "aas_path", length = 500)
    private String aasPath;

    @Column(name = "linked_at")
    private LocalDateTime linkedAt;

    @Builder
    private AasLinkage(String nodeId, Long elementId, String aasPath, LocalDateTime linkedAt) {
        this.nodeId = nodeId;
        this.elementId = elementId;
        this.aasPath = aasPath;
        this.linkedAt = linkedAt;
    }

    public static AasLinkage create(String nodeId, Long elementId, String aasPath) {
        return AasLinkage.builder()
                .nodeId(nodeId)
                .elementId(elementId)
                .aasPath(aasPath)
                .linkedAt(LocalDateTime.now())
                .build();
    }
}
