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
@Table(name = "dms_doc_file")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DmsDocFile extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

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

    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "revision_note", length = 500)
    private String revisionNote;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Builder
    private DmsDocFile(Long documentId, String fileName, String storedName, String filePath,
                       Long fileSize, String contentType, String version, String revisionNote,
                       String uploadedBy, String isActive) {
        this.documentId = documentId;
        this.fileName = fileName;
        this.storedName = storedName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.version = version;
        this.revisionNote = revisionNote;
        this.uploadedBy = uploadedBy;
        this.isActive = isActive;
    }

    public static DmsDocFile create(Long documentId, String fileName, String storedName,
                                     String filePath, Long fileSize, String contentType,
                                     String version, String revisionNote, String uploadedBy) {
        return DmsDocFile.builder()
                .documentId(documentId)
                .fileName(fileName)
                .storedName(storedName)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .version(version != null ? version : "1.0")
                .revisionNote(revisionNote)
                .uploadedBy(uploadedBy)
                .isActive("Y")
                .build();
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
