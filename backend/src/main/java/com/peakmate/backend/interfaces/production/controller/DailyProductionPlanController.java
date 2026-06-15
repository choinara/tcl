package com.peakmate.backend.interfaces.production.controller;

import com.peakmate.backend.domain.production.entity.DailyProductionPlan;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.production.DailyProductionPlanJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import com.peakmate.backend.interfaces.production.dto.request.SaveDailyPlanRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/production/daily-plans")
@RequiredArgsConstructor
public class DailyProductionPlanController {

    private final DailyProductionPlanJpaRepository planRepo;

    /**
     * 3개월치 일별생산계획 조회 (시작월 기준 +2개월)
     */
    @RequirePermission(menu = "PM0030", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        // 3개월 범위 계산 (연도 경계 처리)
        List<int[]> monthRange = calcThreeMonths(year, month);

        // 연도별로 그룹핑하여 조회
        int y1 = monthRange.get(0)[0];
        int y2 = monthRange.get(monthRange.size() - 1)[0];
        List<Integer> months1 = new ArrayList<>();
        List<Integer> months2 = new ArrayList<>();

        for (int[] ym : monthRange) {
            if (ym[0] == y1) months1.add(ym[1]);
            else months2.add(ym[1]);
        }
        if (months2.isEmpty()) months2.add(0); // 빈 리스트 방지

        List<DailyProductionPlan> entities = planRepo.findByThreeMonths(y1, months1, y2, months2);

        // 3개월 데이터를 제품별로 묶어서 반환
        List<Map<String, Object>> content = mergeToRows(entities, monthRange);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    /**
     * 일별생산계획 일괄 저장 (3개월분)
     */
    @RequirePermission(menu = "PM0030", action = "create")
    @PostMapping
    @Transactional
    public ApiResponse<Map<String, Object>> save(@Valid @RequestBody SaveDailyPlanRequest request) {
        int startYear = request.year();
        int startMonth = request.month();
        List<int[]> monthRange = calcThreeMonths(startYear, startMonth);

        // 3개월분 기존 데이터 삭제
        for (int[] ym : monthRange) {
            planRepo.deleteByPlanYearAndPlanMonth(ym[0], ym[1]);
        }
        planRepo.flush();

        // 신규 등록
        int savedCount = 0;
        for (SaveDailyPlanRequest.PlanRowDto dto : request.rows()) {
            int mOffset = dto.monthOffset() != null ? dto.monthOffset() : 0;
            int[] ym = monthRange.get(mOffset);

            DailyProductionPlan entity = DailyProductionPlan.create(
                    ym[0], ym[1], dto.customer(), dto.lineCode(), dto.productName(),
                    dto.spec(), dto.material(), dto.planType(), savedCount);

            if (dto.quantities() != null) {
                for (int d = 1; d <= 31; d++) {
                    BigDecimal val = dto.quantities().get("d" + d);
                    entity.setDay(d, val);
                }
            }

            planRepo.save(entity);
            savedCount++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("savedCount", savedCount);
        return ApiResponse.success(result, savedCount + "건이 저장되었습니다.");
    }

    /**
     * 월별 삭제
     */
    @RequirePermission(menu = "PM0030", action = "delete")
    @DeleteMapping
    @Transactional
    public ApiResponse<Void> deleteByMonth(
            @RequestParam Integer year,
            @RequestParam Integer month,
            @RequestParam(required = false) String lineCode) {
        if (lineCode != null && !lineCode.isBlank()) {
            List<DailyProductionPlan> targets =
                    planRepo.findByPlanYearAndPlanMonthOrderBySortOrderAsc(year, month)
                            .stream().filter(p -> lineCode.equals(p.getLineCode())).toList();
            planRepo.deleteAll(targets);
            return ApiResponse.success(year + "년 " + month + "월 " + lineCode + " 데이터가 삭제되었습니다.");
        }
        planRepo.deleteByPlanYearAndPlanMonth(year, month);
        return ApiResponse.success(year + "년 " + month + "월 데이터가 삭제되었습니다.");
    }

    /**
     * 단건 삭제
     */
    @RequirePermission(menu = "PM0030", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        planRepo.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    /**
     * 3개월 (year, month) 쌍 계산
     */
    private List<int[]> calcThreeMonths(int year, int month) {
        List<int[]> result = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            int m = ((month - 1 + i) % 12) + 1;
            int y = year + (month - 1 + i) / 12;
            result.add(new int[]{y, m});
        }
        return result;
    }

    /**
     * DB의 월별 행을 프론트용 3개월 통합 행으로 변환
     * 같은 lineCode+productName+spec+material+planType → 1행에 m0_d1~m2_d31
     */
    private List<Map<String, Object>> mergeToRows(List<DailyProductionPlan> entities,
                                                   List<int[]> monthRange) {
        // 키 = customer|lineCode|productName|spec|material|planType
        Map<String, Map<String, Object>> rowMap = new LinkedHashMap<>();
        Map<String, Integer> sortMap = new LinkedHashMap<>();

        for (DailyProductionPlan e : entities) {
            String key = e.getCustomer() + "|" + e.getLineCode() + "|" + e.getProductName() + "|" +
                         e.getSpec() + "|" + e.getMaterial() + "|" + e.getPlanType();

            Map<String, Object> row = rowMap.computeIfAbsent(key, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("customer", e.getCustomer());
                m.put("lineCode", e.getLineCode());
                m.put("productName", e.getProductName());
                m.put("spec", e.getSpec());
                m.put("material", e.getMaterial());
                m.put("planType", e.getPlanType());
                m.put("quantities", new LinkedHashMap<String, BigDecimal>());
                return m;
            });

            sortMap.putIfAbsent(key, e.getSortOrder());

            // 해당 entity가 몇 번째 월인지 찾기
            int mOffset = -1;
            for (int i = 0; i < monthRange.size(); i++) {
                if (monthRange.get(i)[0] == e.getPlanYear() &&
                    monthRange.get(i)[1] == e.getPlanMonth()) {
                    mOffset = i;
                    break;
                }
            }
            if (mOffset < 0) continue;

            @SuppressWarnings("unchecked")
            Map<String, BigDecimal> quantities = (Map<String, BigDecimal>) row.get("quantities");
            for (int d = 1; d <= 31; d++) {
                BigDecimal val = e.getDay(d);
                if (val != null) {
                    quantities.put("m" + mOffset + "_d" + d, val);
                }
            }
        }

        // sortOrder 순으로 정렬
        List<Map.Entry<String, Map<String, Object>>> sorted = new ArrayList<>(rowMap.entrySet());
        sorted.sort(Comparator.comparingInt(a -> sortMap.getOrDefault(a.getKey(), 0)));

        return sorted.stream().map(Map.Entry::getValue).toList();
    }
}
