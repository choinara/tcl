package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * AASX 파일 엔티티
 */
@Getter
@Entity
@Table(name = "aasx_file")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AasxFile extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "aas_version", length = 20)
    private String aasVersion;

    @Column(name = "shell_count")
    private Integer shellCount;

    @Column(name = "submodel_count")
    private Integer submodelCount;

    @Column(name = "element_count")
    private Integer elementCount;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Builder
    private AasxFile(String fileName, String fileHash, String filePath, Long fileSize,
                     String aasVersion, Integer shellCount, Integer submodelCount, Integer elementCount,
                     String useYn) {
        this.fileName = fileName;
        this.fileHash = fileHash;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.aasVersion = aasVersion;
        this.shellCount = shellCount;
        this.submodelCount = submodelCount;
        this.elementCount = elementCount;
        this.useYn = useYn;
    }

    public static AasxFile create(String fileName, String fileHash, String filePath, Long fileSize,
                                   String aasVersion, int shellCount, int submodelCount, int elementCount) {
        return AasxFile.builder()
                .fileName(fileName)
                .fileHash(fileHash)
                .filePath(filePath)
                .fileSize(fileSize)
                .aasVersion(aasVersion)
                .shellCount(shellCount)
                .submodelCount(submodelCount)
                .elementCount(elementCount)
                .useYn("Y")
                .build();
    }

    public void updateCounts(int shellCount, int submodelCount, int elementCount) {
        this.shellCount = shellCount;
        this.submodelCount = submodelCount;
        this.elementCount = elementCount;
    }
}
