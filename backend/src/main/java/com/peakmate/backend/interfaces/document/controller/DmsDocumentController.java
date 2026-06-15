package com.peakmate.backend.interfaces.document.controller;

import com.peakmate.backend.application.document.DmsFileStorageService;
import com.peakmate.backend.domain.document.entity.DmsDocFile;
import com.peakmate.backend.domain.document.entity.DmsDocument;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.document.DmsDocFileJpaRepository;
import com.peakmate.backend.infra.repository.document.DmsDocumentJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/dms/documents")
@RequiredArgsConstructor
public class DmsDocumentController {

    private final DmsDocumentJpaRepository documentRepo;
    private final DmsDocFileJpaRepository docFileRepo;
    private final DmsFileStorageService fileStorageService;

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping
    public ApiResponse<List<DmsDocument>> list(
            @RequestParam String category,
            @RequestParam(required = false) String keyword) {
        List<DmsDocument> docs;
        if (keyword != null && !keyword.isBlank()) {
            docs = documentRepo.findByCategoryAndTitleContainingAndIsActiveOrderByIdDesc(category, keyword, "Y");
        } else {
            docs = documentRepo.findByCategoryAndIsActiveOrderByIdDesc(category, "Y");
        }
        return ApiResponse.success(docs);
    }

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/templates")
    public ApiResponse<List<DmsDocument>> listTemplates() {
        List<DmsDocument> templates = documentRepo
                .findByCategoryAndIsTemplateAndIsActiveOrderByIdDesc("FORM", true, "Y");
        return ApiResponse.success(templates);
    }

    @RequirePermission(menu = "DOC0010", action = "create")
    @PostMapping
    public ApiResponse<DmsDocument> create(@RequestBody Map<String, Object> body) {
        DmsDocument doc = DmsDocument.create(
                toStr(body.get("docNumber")),
                toStr(body.get("title")),
                toStr(body.get("category")),
                toStr(body.get("description")),
                toLong(body.get("productId")),
                toLong(body.get("equipmentId")),
                toLong(body.get("departmentId")),
                toStr(body.get("issuer")),
                parseDate(body.get("validFrom")),
                parseDate(body.get("validUntil")),
                toBool(body.get("isTemplate")),
                toStr(body.get("periodType")),
                toInt(body.get("dueDay")),
                toLong(body.get("assigneeId")),
                toStr(body.get("version")),
                toStr(body.get("status")),
                toStr(body.get("tags"))
        );
        documentRepo.save(doc);
        return ApiResponse.success(doc);
    }

    @RequirePermission(menu = "DOC0010", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<DmsDocument> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        DmsDocument doc = documentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다: " + id));
        doc.update(
                toStr(body.get("docNumber")),
                toStr(body.get("title")),
                toStr(body.get("description")),
                toLong(body.get("productId")),
                toLong(body.get("equipmentId")),
                toLong(body.get("departmentId")),
                toStr(body.get("issuer")),
                parseDate(body.get("validFrom")),
                parseDate(body.get("validUntil")),
                toBool(body.get("isTemplate")),
                toStr(body.get("periodType")),
                toInt(body.get("dueDay")),
                toLong(body.get("assigneeId")),
                toStr(body.get("version")),
                toStr(body.get("status")),
                toStr(body.get("tags"))
        );
        documentRepo.save(doc);
        return ApiResponse.success(doc);
    }

    @RequirePermission(menu = "DOC0010", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        DmsDocument doc = documentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다: " + id));
        doc.deactivate();
        documentRepo.save(doc);
        return ApiResponse.success("삭제되었습니다");
    }

    // ===== 파일 관리 =====

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/{docId}/files")
    public ApiResponse<List<DmsDocFile>> getFiles(@PathVariable Long docId) {
        List<DmsDocFile> files = docFileRepo.findByDocumentIdAndIsActiveOrderByCreatedAtDesc(docId, "Y");
        return ApiResponse.success(files);
    }

    @RequirePermission(menu = "DOC0010", action = "create")
    @PostMapping("/{docId}/files")
    public ApiResponse<DmsDocFile> uploadFile(
            @PathVariable Long docId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String version,
            @RequestParam(required = false) String revisionNote,
            Authentication auth) {
        DmsDocument doc = documentRepo.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다: " + docId));

        String username = auth != null ? auth.getName() : null;
        DmsFileStorageService.StoredFileInfo stored = fileStorageService.store(file, doc.getCategory(), docId);

        DmsDocFile docFile = DmsDocFile.create(
                docId, stored.originalName(), stored.storedName(),
                stored.filePath(), stored.fileSize(), stored.contentType(),
                version, revisionNote, username
        );
        docFileRepo.save(docFile);
        return ApiResponse.success(docFile);
    }

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        DmsDocFile docFile = docFileRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다: " + fileId));
        Resource resource = fileStorageService.loadAsResource(docFile.getFilePath());
        String encodedName = URLEncoder.encode(docFile.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .body(resource);
    }

    @RequirePermission(menu = "DOC0010", action = "delete")
    @DeleteMapping("/files/{fileId}")
    public ApiResponse<Void> deleteFile(@PathVariable Long fileId) {
        DmsDocFile docFile = docFileRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다: " + fileId));
        docFile.deactivate();
        docFileRepo.save(docFile);
        return ApiResponse.success("파일이 삭제되었습니다");
    }

    // ===== helpers =====

    private String toStr(Object val) {
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        return Long.parseLong(s);
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.intValue();
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        return Integer.parseInt(s);
    }

    private Boolean toBool(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean b) return b;
        return Boolean.parseBoolean(val.toString());
    }

    private LocalDate parseDate(Object val) {
        if (val == null) return null;
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        return LocalDate.parse(s);
    }
}
