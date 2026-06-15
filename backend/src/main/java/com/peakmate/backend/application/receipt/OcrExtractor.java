package com.peakmate.backend.application.receipt;

import com.peakmate.backend.interfaces.receipt.dto.OcrResultDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface OcrExtractor {
    List<OcrResultDto> extract(MultipartFile file, String model) throws IOException;
}
