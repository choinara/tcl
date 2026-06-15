package com.peakmate.backend.application.excel.util;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FormulaError;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@Component
public class PdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(PdfGenerator.class);
    private static final float FONT_SIZE = 8f;
    private static final float HEADER_FONT_SIZE = 9f;
    private static final float CELL_PADDING = 4f;
    private BaseFont baseFont;

    @PostConstruct
    void init() { baseFont = loadFont(); }

    public byte[] generate(Sheet sheet) throws IOException, DocumentException {
        int columnCount = calculateColumnCount(sheet);
        if (columnCount == 0) return createEmptyPdf(sheet.getSheetName());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(
                columnCount > 8 ? PageSize.A4.rotate() : PageSize.A4, 20, 20, 30, 30);
        PdfWriter.getInstance(document, out);
        document.open();

        com.lowagie.text.Font titleFont = new com.lowagie.text.Font(baseFont, 12, com.lowagie.text.Font.BOLD);
        Paragraph title = new Paragraph(sheet.getSheetName(), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        Map<String, CellRangeAddress> mergedRegionMap = buildMergedRegionMap(sheet);
        PdfPTable table = new PdfPTable(columnCount);
        table.setWidthPercentage(100);
        table.setHeaderRows(1);

        for (Row row : sheet) {
            for (int c = 0; c < columnCount; c++) {
                String key = row.getRowNum() + "," + c;
                CellRangeAddress merged = mergedRegionMap.get(key);
                if (merged != null && (row.getRowNum() != merged.getFirstRow() || c != merged.getFirstColumn())) continue;
                Cell cell = row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                PdfPCell pdfCell = createPdfCell(cell, row.getRowNum() == sheet.getFirstRowNum());
                if (merged != null) {
                    int colspan = merged.getLastColumn() - merged.getFirstColumn() + 1;
                    int rowspan = merged.getLastRow() - merged.getFirstRow() + 1;
                    if (colspan > 1) pdfCell.setColspan(colspan);
                    if (rowspan > 1) pdfCell.setRowspan(rowspan);
                }
                table.addCell(pdfCell);
            }
        }
        document.add(table);
        document.close();
        return out.toByteArray();
    }

    private PdfPCell createPdfCell(Cell cell, boolean isHeader) {
        String value = getCellValue(cell);
        float fontSize = isHeader ? HEADER_FONT_SIZE : FONT_SIZE;
        int style = isHeader ? com.lowagie.text.Font.BOLD : com.lowagie.text.Font.NORMAL;
        com.lowagie.text.Font font = new com.lowagie.text.Font(baseFont, fontSize, style);
        PdfPCell pdfCell = new PdfPCell(new Phrase(value, font));
        pdfCell.setPadding(CELL_PADDING);
        pdfCell.setNoWrap(false);
        if (isHeader) {
            pdfCell.setBackgroundColor(new java.awt.Color(220, 230, 241));
            pdfCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        } else if (cell != null && cell.getCellType() == CellType.NUMERIC) {
            pdfCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        }
        return pdfCell;
    }

    private Map<String, CellRangeAddress> buildMergedRegionMap(Sheet sheet) {
        Map<String, CellRangeAddress> map = new HashMap<>();
        for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
            CellRangeAddress region = sheet.getMergedRegion(i);
            for (int r = region.getFirstRow(); r <= region.getLastRow(); r++)
                for (int c = region.getFirstColumn(); c <= region.getLastColumn(); c++)
                    map.put(r + "," + c, region);
        }
        return map;
    }

    private int calculateColumnCount(Sheet sheet) {
        int max = 0;
        for (Row row : sheet) { int last = row.getLastCellNum(); if (last > max) max = last; }
        return max;
    }

    private byte[] createEmptyPdf(String sheetName) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();
        document.add(new Paragraph(sheetName + " - 데이터 없음", new com.lowagie.text.Font(baseFont, 12)));
        document.close();
        return out.toByteArray();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) return cell.getLocalDateTimeCellValue().toString();
                double v = cell.getNumericCellValue();
                return v == Math.floor(v) && !Double.isInfinite(v) ? String.valueOf((long)v) : String.valueOf(v);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try { return String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { try { return cell.getStringCellValue(); } catch (Exception e2) { return ""; } }
            case BLANK: return "";
            default: return cell.toString();
        }
    }

    private BaseFont loadFont() {
        try {
            ClassPathResource res = new ClassPathResource("fonts/NanumGothic-Regular.ttf");
            if (res.exists()) {
                Path temp = Files.createTempFile("NanumGothic", ".ttf");
                try (InputStream in = res.getInputStream()) { Files.write(temp, in.readAllBytes()); }
                return BaseFont.createFont(temp.toAbsolutePath().toString(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
        } catch (Exception e) { log.warn("classpath font load fail: {}", e.getMessage()); }
        String[] fonts = {"/System/Library/Fonts/Supplemental/AppleGothic.ttf", "/Library/Fonts/NanumGothic.ttf",
                "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"};
        for (String path : fonts) {
            try { if (Files.exists(Path.of(path))) return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED); }
            catch (Exception e) { /* skip */ }
        }
        try { return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED); }
        catch (Exception e) { throw new RuntimeException("Font load failed", e); }
    }
}
