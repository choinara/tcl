package com.peakmate.backend.global.util;

import com.peakmate.core.error.CommonErrorCode;
import com.peakmate.core.error.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * 파일 업로드 보안 검증 유틸리티.
 * 확장자, MIME 타입, 파일 크기를 검증합니다.
 */
@Slf4j
public final class FileUploadValidator {

    private FileUploadValidator() {}

    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "txt", "csv", "rtf", "doc", "docx"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "txt", "csv", "rtf",
            "png", "jpg", "jpeg", "gif", "bmp", "svg", "webp",
            "zip", "7z", "tar", "gz",
            "dwg", "dxf", "step", "stp", "igs", "iges"
    );

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "com", "msi", "scr", "pif",
            "vbs", "vbe", "js", "jse", "wsf", "wsh", "ps1",
            "sh", "bash", "csh", "ksh",
            "jar", "war", "class",
            "php", "asp", "aspx", "jsp", "cgi", "py", "rb", "pl",
            "dll", "so", "dylib",
            "hta", "inf", "reg", "rgs", "sct", "url", "lnk"
    );

    private static final long DEFAULT_MAX_SIZE = 50L * 1024 * 1024;

    public static void validate(MultipartFile file) {
        validate(file, DEFAULT_MAX_SIZE);
    }

    public static void validate(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("파일이 비어있습니다.", CommonErrorCode.INVALID_INPUT_VALUE);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BusinessException("파일명이 없습니다.", CommonErrorCode.INVALID_INPUT_VALUE);
        }

        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BusinessException("잘못된 파일명입니다.", CommonErrorCode.INVALID_INPUT_VALUE);
        }

        String extension = getExtension(originalFilename).toLowerCase();
        if (extension.isEmpty()) {
            throw new BusinessException("파일 확장자가 없습니다.", CommonErrorCode.INVALID_INPUT_VALUE);
        }
        if (BLOCKED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(
                    "보안상 허용되지 않는 파일 형식입니다: ." + extension, CommonErrorCode.INVALID_INPUT_VALUE);
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(
                    "허용되지 않는 파일 형식입니다: ." + extension, CommonErrorCode.INVALID_INPUT_VALUE);
        }

        if (file.getSize() > maxSizeBytes) {
            throw new BusinessException(
                    "파일 크기가 제한(%dMB)을 초과했습니다.".formatted(maxSizeBytes / 1024 / 1024),
                    CommonErrorCode.INVALID_INPUT_VALUE);
        }

        String contentType = file.getContentType();
        if (contentType != null && isExecutableMimeType(contentType)) {
            throw new BusinessException(
                    "보안상 허용되지 않는 파일 형식입니다.", CommonErrorCode.INVALID_INPUT_VALUE);
        }
    }

    private static String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot < 0 || lastDot == filename.length() - 1) return "";
        return filename.substring(lastDot + 1);
    }

    /**
     * 텍스트 기반 첨부파일의 개인정보 포함 여부를 검사합니다.
     * 개인정보가 탐지되면 경고를 반환합니다 (업로드는 차단하지 않고 경고만).
     *
     * @return 탐지된 개인정보 유형 목록 (비어있으면 미탐지)
     */
    public static List<PersonalInfoDetector.DetectionResult> checkPii(MultipartFile file) {
        if (file == null || file.isEmpty()) return List.of();

        String extension = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!TEXT_EXTENSIONS.contains(extension)) return List.of();

        // txt, csv 파일만 내용 검사 (바이너리 파일은 제외)
        if (!("txt".equals(extension) || "csv".equals(extension))) return List.of();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            int lineCount = 0;
            while ((line = reader.readLine()) != null && lineCount < 100) {
                sb.append(line).append("\n");
                lineCount++;
            }
            return PersonalInfoDetector.detect(sb.toString());
        } catch (Exception e) {
            log.debug("PII check failed for file: {}", file.getOriginalFilename(), e);
            return List.of();
        }
    }

    private static boolean isExecutableMimeType(String contentType) {
        return contentType.startsWith("application/x-executable") ||
               contentType.startsWith("application/x-msdos-program") ||
               contentType.startsWith("application/x-msdownload") ||
               contentType.equals("application/x-sh") ||
               contentType.equals("application/x-shellscript");
    }
}
