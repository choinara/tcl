package com.peakmate.backend.domain.email.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "email_attachment")
public class EmailAttachment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_message_id", nullable = false)
    private Long emailMessageId;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "storage_filename", length = 64)
    private String storageFilename;

    @Column(name = "extracted_data", columnDefinition = "JSONB")
    private String extractedData;

    @Column(name = "av_scan_status", length = 20, nullable = false)
    private String avScanStatus = "PENDING";

    @Column(name = "av_scan_at")
    private OffsetDateTime avScanAt;

    @Column(name = "av_scan_result", length = 500)
    private String avScanResult;

    protected EmailAttachment() {
    }

    public static EmailAttachment create(Long emailMessageId, String fileName, String mimeType,
                                          Long sizeBytes, String storagePath, String storageFilename) {
        EmailAttachment e = new EmailAttachment();
        e.emailMessageId = emailMessageId;
        e.fileName = fileName;
        e.mimeType = mimeType;
        e.sizeBytes = sizeBytes;
        e.storagePath = storagePath;
        e.storageFilename = storageFilename;
        e.avScanStatus = "PENDING";
        return e;
    }

    /**
     * AV 스캔 결과 반영.
     * avScanAt은 스캔 행위의 비즈니스 타임스탬프 (Rule 8-1 예외).
     */
    public void updateAvScanResult(String status, String result) {
        this.avScanStatus = status;
        this.avScanResult = result;
        this.avScanAt = OffsetDateTime.now();
    }

    public void updateExtractedData(String extractedData) {
        this.extractedData = extractedData;
    }
}
