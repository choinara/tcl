package com.peakmate.backend.interfaces.document.controller;

import com.peakmate.backend.application.document.DmsFileStorageService;
import com.peakmate.backend.domain.document.entity.DmsDocInstance;
import com.peakmate.backend.domain.document.entity.DmsDocInstanceFile;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.document.DmsDocInstanceFileJpaRepository;
import com.peakmate.backend.infra.repository.document.DmsDocInstanceJpaRepository;
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
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/dms/instances")
@RequiredArgsConstructor
public class DmsDocInstanceController {

    private final DmsDocInstanceJpaRepository instanceRepo;
    private final DmsDocInstanceFileJpaRepository instanceFileRepo;
    private final DmsFileStorageService fileStorageService;

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping
    public ApiResponse<List<DmsDocInstance>> list(
            @RequestParam Long templateId,
            @RequestParam(required = false) String status) {
        List<DmsDocInstance> list;
        if (status != null && !status.isBlank()) {
            list = instanceRepo.findByTemplateIdAndStatusAndIsActiveOrderByIdDesc(templateId, status, "Y");
        } else {
            list = instanceRepo.findByTemplateIdAndIsActiveOrderByIdDesc(templateId, "Y");
        }
        return ApiResponse.success(list);
    }

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/{id}")
    public ApiResponse<DmsDocInstance> findById(@PathVariable Long id) {
        DmsDocInstance instance = instanceRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("인스턴스를 찾을 수 없습니다: " + id));
        return ApiResponse.success(instance);
    }

    @RequirePermission(menu = "DOC0010", action = "create")
    @PostMapping
    public ApiResponse<DmsDocInstance> create(@RequestBody Map<String, Object> body) {
        DmsDocInstance instance = DmsDocInstance.create(
                toLong(body.get("templateId")),
                (String) body.get("periodLabel"),
                (String) body.get("status"),
                parseDate(body.get("dueDate")),
                toLong(body.get("assigneeId")),
                toLong(body.get("approverId")),
                (String) body.get("remark")
        );
        instanceRepo.save(instance);
        return ApiResponse.success(instance);
    }

    @RequirePermission(menu = "DOC0010", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<DmsDocInstance> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        DmsDocInstance instance = instanceRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("인스턴스를 찾을 수 없습니다: " + id));
        instance.update(
                (String) body.get("status"),
                parseDate(body.get("dueDate")),
                toLong(body.get("assigneeId")),
                toLong(body.get("approverId")),
                (String) body.get("remark")
        );
        instanceRepo.save(instance);
        return ApiResponse.success(instance);
    }

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Long>> dashboard() {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("NOT_STARTED", instanceRepo.countByStatus("NOT_STARTED"));
        result.put("IN_PROGRESS", instanceRepo.countByStatus("IN_PROGRESS"));
        result.put("COMPLETED", instanceRepo.countByStatus("COMPLETED"));
        result.put("APPROVED", instanceRepo.countByStatus("APPROVED"));
        result.put("OVERDUE", instanceRepo.countOverdue());
        return ApiResponse.success(result);
    }

    // ===== 인스턴스 파일 =====

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/{instanceId}/files")
    public ApiResponse<List<DmsDocInstanceFile>> getFiles(@PathVariable Long instanceId) {
        List<DmsDocInstanceFile> files = instanceFileRepo
                .findByInstanceIdAndIsActiveOrderByCreatedAtDesc(instanceId, "Y");
        return ApiResponse.success(files);
    }

    @RequirePermission(menu = "DOC0010", action = "create")
    @PostMapping("/{instanceId}/files")
    public ApiResponse<DmsDocInstanceFile> uploadFile(
            @PathVariable Long instanceId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("인스턴스를 찾을 수 없습니다: " + instanceId));

        String username = auth != null ? auth.getName() : null;
        DmsFileStorageService.StoredFileInfo stored = fileStorageService.store(file, "INSTANCE", instanceId);

        DmsDocInstanceFile instFile = DmsDocInstanceFile.create(
                instanceId, stored.originalName(), stored.storedName(),
                stored.filePath(), stored.fileSize(), stored.contentType(),
                username
        );
        instanceFileRepo.save(instFile);
        return ApiResponse.success(instFile);
    }

    @RequirePermission(menu = "DOC0010", action = "read")
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        DmsDocInstanceFile instFile = instanceFileRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다: " + fileId));
        Resource resource = fileStorageService.loadAsResource(instFile.getFilePath());
        String encodedName = URLEncoder.encode(instFile.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .body(resource);
    }

    // ===== helpers =====

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        return Long.parseLong(s);
    }

    private LocalDate parseDate(Object val) {
        if (val == null) return null;
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        return LocalDate.parse(s);
    }
}
