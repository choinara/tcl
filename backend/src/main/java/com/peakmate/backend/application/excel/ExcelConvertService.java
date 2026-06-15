package com.peakmate.backend.application.excel;

import com.peakmate.backend.application.excel.dto.ConvertSaveResponse;
import com.peakmate.backend.application.excel.util.CsvGenerator;
import com.peakmate.backend.application.excel.util.PdfGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelConvertService {

    private final CsvGenerator csvGenerator;
    private final PdfGenerator pdfGenerator;

    @Value("${excel.convert.output-dir:${user.home}/excel-convert}")
    private String baseOutputDir;

    public byte[] convertToZip(MultipartFile file) throws Exception {
        validateFile(file);
        ByteArrayOutputStream zipOut = new ByteArrayOutputStream();
        try (InputStream in = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(in);
             ZipOutputStream zos = new ZipOutputStream(zipOut)) {
            int sheetCount = workbook.getNumberOfSheets();
            for (int i = 0; i < sheetCount; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sanitizeFileName(sheet.getSheetName());
                byte[] csv = csvGenerator.generate(sheet);
                zos.putNextEntry(new ZipEntry(sheetName + ".csv"));
                zos.write(csv);
                zos.closeEntry();
                byte[] pdf = pdfGenerator.generate(sheet);
                zos.putNextEntry(new ZipEntry(sheetName + ".pdf"));
                zos.write(pdf);
                zos.closeEntry();
            }
        }
        return zipOut.toByteArray();
    }

    public ConvertSaveResponse convertToFolder(MultipartFile file, String folderName, String outputPath) throws Exception {
        validateFile(file);
        if (folderName == null || folderName.isBlank()) {
            String originalName = file.getOriginalFilename();
            folderName = originalName != null ? originalName.replaceAll("\\.(xlsx|xls)$", "") : "result";
        }
        folderName = sanitizeFileName(folderName);
        String basePath = (outputPath != null && !outputPath.isBlank()) ? outputPath.trim() : baseOutputDir;
        Path outputDir = Paths.get(basePath).resolve(folderName);
        Files.createDirectories(outputDir);
        List<ConvertSaveResponse.SheetFile> sheetFiles = new ArrayList<>();
        try (InputStream in = file.getInputStream(); Workbook workbook = WorkbookFactory.create(in)) {
            int sheetCount = workbook.getNumberOfSheets();
            for (int i = 0; i < sheetCount; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sanitizeFileName(sheet.getSheetName());
                byte[] csv = csvGenerator.generate(sheet);
                Path csvPath = outputDir.resolve(sheetName + ".csv");
                Files.write(csvPath, csv);
                byte[] pdf = pdfGenerator.generate(sheet);
                Path pdfPath = outputDir.resolve(sheetName + ".pdf");
                Files.write(pdfPath, pdf);
                sheetFiles.add(ConvertSaveResponse.SheetFile.builder()
                        .sheetName(sheet.getSheetName()).csvPath(csvPath.toString()).csvSize(csv.length)
                        .pdfPath(pdfPath.toString()).pdfSize(pdf.length).build());
            }
            return ConvertSaveResponse.builder()
                    .outputDirectory(outputDir.toString()).sheetCount(sheetCount).files(sheetFiles).build();
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("파일이 비어있습니다.");
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")))
            throw new IllegalArgumentException("Excel 파일(.xlsx, .xls)만 업로드 가능합니다.");
    }

    private String sanitizeFileName(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }
}
