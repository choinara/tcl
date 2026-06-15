package com.peakmate.backend.application.report;

import com.peakmate.backend.application.report.dto.ReportColumn;
import com.peakmate.backend.application.report.dto.ReportRequest;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import net.sf.jasperreports.engine.design.*;
import net.sf.jasperreports.engine.type.HorizontalTextAlignEnum;
import net.sf.jasperreports.engine.type.ModeEnum;
import net.sf.jasperreports.engine.type.OrientationEnum;
import net.sf.jasperreports.engine.type.VerticalTextAlignEnum;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleXlsxReportConfiguration;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.*;

@Service
public class JasperReportService {

    private static final String FONT_NAME = "NanumGothic";
    private static final int ROW_HEIGHT = 20;
    private static final int HEADER_HEIGHT = 24;
    private static final int TITLE_HEIGHT = 30;
    private static final int MARGIN = 20;

    public byte[] generateListReport(ReportRequest request) throws JRException {
        List<ReportColumn> columns = request.getColumns();
        List<Map<String, Object>> data = request.getData();
        String format = request.getFormat() != null ? request.getFormat().toUpperCase() : "PDF";

        int totalWidth = columns.stream().mapToInt(ReportColumn::getWidth).sum();
        boolean landscape = totalWidth > 555;

        int pageWidth = landscape ? 842 : 595;
        int pageHeight = landscape ? 595 : 842;
        int usableWidth = pageWidth - (MARGIN * 2);
        double scale = totalWidth > usableWidth ? (double) usableWidth / totalWidth : 1.0;

        JasperDesign design = new JasperDesign();
        design.setName("ListReport");
        design.setPageWidth(pageWidth);
        design.setPageHeight(pageHeight);
        design.setOrientation(landscape ? OrientationEnum.LANDSCAPE : OrientationEnum.PORTRAIT);
        design.setLeftMargin(MARGIN);
        design.setRightMargin(MARGIN);
        design.setTopMargin(MARGIN);
        design.setBottomMargin(MARGIN);
        design.setColumnWidth(usableWidth);

        for (ReportColumn col : columns) {
            JRDesignField field = new JRDesignField();
            field.setName(col.getField());
            field.setValueClass(String.class);
            design.addField(field);
        }

        JRDesignBand titleBand = new JRDesignBand();
        titleBand.setHeight(TITLE_HEIGHT + 5);
        JRDesignStaticText titleText = new JRDesignStaticText();
        titleText.setX(0); titleText.setY(0);
        titleText.setWidth(usableWidth); titleText.setHeight(TITLE_HEIGHT);
        titleText.setText(request.getTitle() != null ? request.getTitle() : "Report");
        titleText.setFontName(FONT_NAME); titleText.setFontSize(14f); titleText.setBold(true);
        titleText.setHorizontalTextAlign(HorizontalTextAlignEnum.CENTER);
        titleText.setVerticalTextAlign(VerticalTextAlignEnum.MIDDLE);
        titleBand.addElement(titleText);
        design.setTitle(titleBand);

        JRDesignBand headerBand = new JRDesignBand();
        headerBand.setHeight(HEADER_HEIGHT);
        int x = 0;
        for (ReportColumn col : columns) {
            int colWidth = (int) (col.getWidth() * scale);
            JRDesignStaticText header = new JRDesignStaticText();
            header.setX(x); header.setY(0);
            header.setWidth(colWidth); header.setHeight(HEADER_HEIGHT);
            header.setText(col.getHeaderName());
            header.setFontName(FONT_NAME); header.setFontSize(9f); header.setBold(true);
            header.setHorizontalTextAlign(HorizontalTextAlignEnum.CENTER);
            header.setVerticalTextAlign(VerticalTextAlignEnum.MIDDLE);
            header.setMode(ModeEnum.OPAQUE);
            header.setBackcolor(new Color(241, 245, 249));
            header.setForecolor(new Color(51, 65, 85));
            JRLineBox box = header.getLineBox();
            box.getPen().setLineWidth(0.5f);
            box.getPen().setLineColor(new Color(226, 232, 240));
            headerBand.addElement(header);
            x += colWidth;
        }
        design.setColumnHeader(headerBand);

        JRDesignBand detailBand = new JRDesignBand();
        detailBand.setHeight(ROW_HEIGHT);
        x = 0;
        for (ReportColumn col : columns) {
            int colWidth = (int) (col.getWidth() * scale);
            JRDesignTextField textField = new JRDesignTextField();
            textField.setX(x); textField.setY(0);
            textField.setWidth(colWidth); textField.setHeight(ROW_HEIGHT);
            textField.setFontName(FONT_NAME); textField.setFontSize(8f);
            textField.setHorizontalTextAlign(HorizontalTextAlignEnum.CENTER);
            textField.setVerticalTextAlign(VerticalTextAlignEnum.MIDDLE);
            textField.setBlankWhenNull(true);
            JRDesignExpression expr = new JRDesignExpression();
            expr.setText("$F{" + col.getField() + "}");
            textField.setExpression(expr);
            JRLineBox box2 = textField.getLineBox();
            box2.getPen().setLineWidth(0.5f);
            box2.getPen().setLineColor(new Color(226, 232, 240));
            detailBand.addElement(textField);
            x += colWidth;
        }
        ((JRDesignSection) design.getDetailSection()).addBand(detailBand);

        JRDesignBand footerBand = new JRDesignBand();
        footerBand.setHeight(20);
        JRDesignTextField pageNumField = new JRDesignTextField();
        pageNumField.setX(0); pageNumField.setY(0);
        pageNumField.setWidth(usableWidth); pageNumField.setHeight(20);
        pageNumField.setFontName(FONT_NAME); pageNumField.setFontSize(8f);
        pageNumField.setHorizontalTextAlign(HorizontalTextAlignEnum.CENTER);
        JRDesignExpression pageExpr = new JRDesignExpression();
        pageExpr.setText("$V{PAGE_NUMBER} + \" / \" + $V{PAGE_COUNT}");
        pageNumField.setExpression(pageExpr);
        footerBand.addElement(pageNumField);
        design.setPageFooter(footerBand);

        JasperReport report = JasperCompileManager.compileReport(design);

        Collection<Map<String, ?>> collection = new ArrayList<>();
        for (Map<String, Object> row : data) {
            Map<String, String> stringRow = new LinkedHashMap<>();
            for (ReportColumn col : columns) {
                Object val = row.get(col.getField());
                stringRow.put(col.getField(), val != null ? String.valueOf(val) : "");
            }
            collection.add(stringRow);
        }

        JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(collection);
        JasperPrint print = JasperFillManager.fillReport(report, new HashMap<>(), dataSource);

        if ("XLSX".equals(format)) {
            return exportToXlsx(print);
        }
        return JasperExportManager.exportReportToPdf(print);
    }

    private byte[] exportToXlsx(JasperPrint print) throws JRException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        JRXlsxExporter exporter = new JRXlsxExporter();
        exporter.setExporterInput(new SimpleExporterInput(print));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(out));
        SimpleXlsxReportConfiguration config = new SimpleXlsxReportConfiguration();
        config.setOnePagePerSheet(false);
        config.setDetectCellType(true);
        config.setWhitePageBackground(false);
        config.setRemoveEmptySpaceBetweenRows(true);
        exporter.setConfiguration(config);
        exporter.exportReport();
        return out.toByteArray();
    }
}
