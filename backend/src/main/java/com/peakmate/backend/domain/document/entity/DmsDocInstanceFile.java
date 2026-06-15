package com.peakmate.backend.domain.document.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Entity
@Table(name = "dms_doc_instance_file")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DmsDocInstanceFile extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "instance_id", nullable = false)
    private Long instanceId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "stored_name", nullable = false, length = 255)
    private String storedName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Builder
    private DmsDocInstanceFile(Long instanceId, String fileName, String storedName,
                                String filePath, Long fileSize, String contentType,
                                String uploadedBy, String isActive) {
        this.instanceId = instanceId;
        this.fileName = fileName;
        this.storedName = storedName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.uploadedBy = uploadedBy;
        this.isActive = isActive;
    }

    public static DmsDocInstanceFile create(Long instanceId, String fileName, String storedName,
                                             String filePath, Long fileSize, String contentType,
                                             String uploadedBy) {
        return DmsDocInstanceFile.builder()
                .instanceId(instanceId)
                .fileName(fileName)
                .storedName(storedName)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .uploadedBy(uploadedBy)
                .isActive("Y")
                .build();
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
