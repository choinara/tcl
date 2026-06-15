package com.peakmate.backend.application.document;

import com.peakmate.core.error.CommonErrorCode;
import com.peakmate.core.error.BusinessException;
import com.peakmate.backend.global.util.FileUploadValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class DmsFileStorageService {

    private final Path baseDir;

    public DmsFileStorageService(
            @Value("${dms.storage-dir:${user.home}/dms-documents}") String storageDir) {
        this.baseDir = Paths.get(storageDir);
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            throw new RuntimeException("DMS 저장 디렉토리 생성 실패: " + storageDir, e);
        }
    }

    public StoredFileInfo store(MultipartFile file, String category, Long documentId) {
        FileUploadValidator.validate(file);

        String originalName = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" + originalName;
        Path dir = baseDir.resolve(category).resolve(String.valueOf(documentId));

        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName);
            file.transferTo(target.toFile());

            return new StoredFileInfo(
                    originalName, storedName,
                    target.toString(),
                    file.getSize(),
                    file.getContentType()
            );
        } catch (IOException e) {
            throw new BusinessException("파일 저장 실패: " + e.getMessage(), CommonErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public Resource loadAsResource(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new BusinessException("파일을 찾을 수 없습니다: " + filePath, CommonErrorCode.ENTITY_NOT_FOUND);
        } catch (MalformedURLException e) {
            throw new BusinessException("파일 경로가 잘못되었습니다: " + filePath, CommonErrorCode.INVALID_INPUT_VALUE);
        }
    }

    public record StoredFileInfo(
            String originalName,
            String storedName,
            String filePath,
            long fileSize,
            String contentType
    ) {}
}
