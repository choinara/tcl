package com.peakmate.backend.interfaces.production.controller;

import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 생산계획 API Controller (Mock 데이터)
 */
@Slf4j
@RestController
@RequestMapping("/api/production/plans")
public class ProductionPlanController {

    private static final String[][] PRODUCTS = {
            {"PET 시트", "0.3T x 600W", "PET", "시트"},
            {"PP 필름", "0.05T x 1000W", "PP", "필름"},
            {"PE 필름", "0.1T x 800W", "PE", "필름"},
            {"ABS 판재", "2.0T x 1200W", "ABS", "판재"},
            {"PC 시트", "1.0T x 600W", "PC", "시트"},
            {"PVC 파이프", "50A x 4M", "PVC", "파이프"},
            {"HDPE 용기", "500ml", "HDPE", "용기"},
            {"PS 트레이", "300 x 200", "PS", "트레이"},
            {"PMMA 판재", "3.0T x 1000W", "PMMA", "판재"},
            {"Nylon 튜브", "12A x 100M", "Nylon", "튜브"},
    };

    @RequirePermission(menu = "PM0010", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int totalElements = 40;
        YearMonth ym = YearMonth.of(2026, 3);
        int daysInMonth = ym.lengthOfMonth();

        // 시드 고정 (페이지 간 일관성)
        Random rng = new Random(42);
        List<Map<String, Object>> allRows = new ArrayList<>();

        for (int i = 0; i < totalElements; i++) {
            String[] p = PRODUCTS[i % PRODUCTS.length];
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", i + 1);
            row.put("lineNo", String.format("L%03d", i + 1));
            row.put("productName", p[0]);
            row.put("spec", p[1]);
            row.put("material", p[2]);
            row.put("category", p[3]);
            row.put("prevStock", rng.nextInt(500) + 100);

            int total = 0;
            for (int d = 1; d <= daysInMonth; d++) {
                LocalDate date = ym.atDay(d);
                DayOfWeek dow = date.getDayOfWeek();
                boolean isWeekend = dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
                int qty = isWeekend ? 0 : rng.nextInt(200) + 50;
                row.put("day" + d, qty);
                total += qty;
            }
            row.put("total", total);
            allRows.add(row);
        }

        int start = page * size;
        int end = Math.min(start + size, totalElements);
        List<Map<String, Object>> content = start < totalElements ? allRows.subList(start, end) : List.of();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("first", page == 0);
        response.put("last", page >= totalPages - 1);

        return ApiResponse.success(response);
    }
}
