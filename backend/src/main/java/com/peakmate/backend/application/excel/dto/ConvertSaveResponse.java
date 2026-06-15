package com.peakmate.backend.application.excel.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class ConvertSaveResponse {
    private String outputDirectory;
    private int sheetCount;
    private List<SheetFile> files;

    @Getter
    @Builder
    public static class SheetFile {
        private String sheetName;
        private String csvPath;
        private long csvSize;
        private String pdfPath;
        private long pdfSize;
    }
}
