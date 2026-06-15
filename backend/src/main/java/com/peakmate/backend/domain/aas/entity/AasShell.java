package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AAS Shell 엔티티
 */
@Getter
@Entity
@Table(name = "aas_shell")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AasShell extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "aasx_file_id", nullable = false)
    private Long aasxFileId;

    @Column(name = "shell_id_short", length = 255)
    private String shellIdShort;

    @Column(name = "global_asset_id", length = 500)
    private String globalAssetId;

    @Column(name = "asset_kind", length = 50)
    private String assetKind;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder
    private AasShell(Long aasxFileId, String shellIdShort, String globalAssetId,
                     String assetKind, String description) {
        this.aasxFileId = aasxFileId;
        this.shellIdShort = shellIdShort;
        this.globalAssetId = globalAssetId;
        this.assetKind = assetKind;
        this.description = description;
    }

    public static AasShell create(Long aasxFileId, String shellIdShort, String globalAssetId,
                                   String assetKind, String description) {
        return AasShell.builder()
                .aasxFileId(aasxFileId)
                .shellIdShort(shellIdShort)
                .globalAssetId(globalAssetId)
                .assetKind(assetKind != null ? assetKind : "Instance")
                .description(description)
                .build();
    }
}
