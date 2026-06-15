package com.peakmate.backend.interfaces.excel.controller;

import com.peakmate.backend.application.excel.ExcelConvertService;
import com.peakmate.backend.application.excel.dto.ConvertSaveResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/excel")
@RequiredArgsConstructor
public class ExcelConvertController {

    private final ExcelConvertService excelConvertService;

    @RequirePermission(menu = "UT0030", action = "create")
    @PostMapping("/convert/download")
    public ResponseEntity<byte[]> convertAndDownload(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] zip = excelConvertService.convertToZip(file);
        String originalName = file.getOriginalFilename();
        String baseName = originalName != null ? originalName.replaceAll("\\.(xlsx|xls)$", "") : "result";
        String zipFileName = URLEncoder.encode(baseName + "_converted.zip", StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + zipFileName)
                .contentType(MediaType.parseMediaType("application/zip"))
                .contentLength(zip.length)
                .body(zip);
    }

    @RequirePermission(menu = "UT0030", action = "create")
    @PostMapping("/convert/save")
    public ResponseEntity<ConvertSaveResponse> convertAndSave(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderName", required = false) String folderName,
            @RequestParam(value = "outputPath", required = false) String outputPath) throws Exception {
        return ResponseEntity.ok(excelConvertService.convertToFolder(file, folderName, outputPath));
    }
}
