package com.peakmate.backend.application.excel.util;

import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

@Component
public class CsvGenerator {

    public byte[] generate(Sheet sheet) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // BOM for Excel UTF-8 recognition
        out.write(0xEF);
        out.write(0xBB);
        out.write(0xBF);

        try (OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
            for (Row row : sheet) {
                int lastCell = row.getLastCellNum();
                for (int c = 0; c < lastCell; c++) {
                    if (c > 0) writer.write(',');
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    String value = getCellValue(cell);
                    // Escape CSV: quote if contains comma, quote, or newline
                    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
                        writer.write('"');
                        writer.write(value.replace("\"", "\"\""));
                        writer.write('"');
                    } else {
                        writer.write(value);
                    }
                }
                writer.write('\n');
            }
        }
        return out.toByteArray();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try { return String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) {
                    try { return cell.getStringCellValue(); }
                    catch (Exception e2) { return ""; }
                }
            case BLANK: return "";
            default: return cell.toString();
        }
    }
}
