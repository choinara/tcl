package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipLossEvent;
import com.peakmate.backend.domain.equiptech.entity.EquipTechInfo;
import com.peakmate.backend.domain.master.entity.MasterEquipment;
import com.peakmate.backend.infra.repository.equiptech.EquipLossEventJpaRepository;
import com.peakmate.backend.infra.repository.equiptech.EquipTechInfoJpaRepository;
import com.peakmate.backend.infra.repository.master.MasterEquipmentJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/et/loss/analysis")
@RequiredArgsConstructor
public class EquipLossAnalysisController {

    private final EquipLossEventJpaRepository lossEventRepository;
    private final MasterEquipmentJpaRepository equipmentRepository;
    private final EquipTechInfoJpaRepository techInfoRepository;

    /**
     * ET0060 - 일자별 Loss 분석
     */
    @RequirePermission(menu = "ET0060", action = "read")
    @GetMapping("/daily")
    public ApiResponse<Map<String, Object>> lossDaily(
            @RequestParam String yearMonth,
            @RequestParam(required = false) String equipCategoryCode) {

        YearMonth ym = YearMonth.parse(yearMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        int daysInMonth = ym.lengthOfMonth();

        List<Long> equipIds = getFilteredEquipIds(equipCategoryCode);
        List<EquipLossEvent> events = fetchEvents(equipIds, start, end);

        // loss_type_code 목록 수집
        Set<String> lossTypeSet = events.stream()
                .map(EquipLossEvent::getLossTypeCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // 일자별 + loss_type별 합산
        // data: [{lossTypeCode, values: [day1_sum, day2_sum, ...]}]
        List<Map<String, Object>> data = new ArrayList<>();
        for (String ltCode : lossTypeSet) {
            int[] dailySums = new int[daysInMonth];
            for (EquipLossEvent ev : events) {
                if (ltCode.equals(ev.getLossTypeCode()) && ev.getFailDate() != null) {
                    int dayIndex = ev.getFailDate().getDayOfMonth() - 1;
                    if (dayIndex >= 0 && dayIndex < daysInMonth) {
                        dailySums[dayIndex] += ev.getLossTimeMin() != null ? ev.getLossTimeMin() : 0;
                    }
                }
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("lossTypeCode", ltCode);
            List<Integer> values = new ArrayList<>();
            for (int v : dailySums) values.add(v);
            entry.put("values", values);
            data.add(entry);
        }

        List<Integer> days = new ArrayList<>();
        for (int i = 1; i <= daysInMonth; i++) days.add(i);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("days", days);
        result.put("lossTypes", lossTypeSet.stream().map(code -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", code);
            return m;
        }).collect(Collectors.toList()));
        result.put("data", data);
        return ApiResponse.success(result);
    }

    /**
     * ET0060 - 설비별 Loss 분석
     */
    @RequirePermission(menu = "ET0060", action = "read")
    @GetMapping("/equip")
    public ApiResponse<Map<String, Object>> lossEquip(
            @RequestParam String yearMonth,
            @RequestParam(required = false) String equipCategoryCode) {

        YearMonth ym = YearMonth.parse(yearMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<MasterEquipment> equipments = getFilteredEquipments(equipCategoryCode);
        List<Long> equipIds = equipments.stream().map(MasterEquipment::getId).toList();
        List<EquipLossEvent> events = fetchEvents(equipIds, start, end);

        // loss_type_code 목록
        Set<String> lossTypeSet = events.stream()
                .map(EquipLossEvent::getLossTypeCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // 설비별 + loss_type별 합산
        List<Map<String, Object>> equipList = equipments.stream().map(eq -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", eq.getId());
            m.put("unitNumber", eq.getUnitNumber());
            m.put("lineName", eq.getLineName());
            m.put("category", eq.getCategory());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> data = new ArrayList<>();
        for (String ltCode : lossTypeSet) {
            int[] equipSums = new int[equipments.size()];
            for (EquipLossEvent ev : events) {
                if (ltCode.equals(ev.getLossTypeCode())) {
                    for (int i = 0; i < equipments.size(); i++) {
                        if (equipments.get(i).getId().equals(ev.getEquipId())) {
                            equipSums[i] += ev.getLossTimeMin() != null ? ev.getLossTimeMin() : 0;
                            break;
                        }
                    }
                }
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("lossTypeCode", ltCode);
            List<Integer> values = new ArrayList<>();
            for (int v : equipSums) values.add(v);
            entry.put("values", values);
            data.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipment", equipList);
        result.put("lossTypes", lossTypeSet.stream().map(code -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", code);
            return m;
        }).collect(Collectors.toList()));
        result.put("data", data);
        return ApiResponse.success(result);
    }

    /**
     * ET0070 - MTBF 분석
     * MTBF = (총 가동 가능 시간 - 총 Loss 시간) / 고장 건수
     */
    @RequirePermission(menu = "ET0070", action = "read")
    @GetMapping("/mtbf")
    public ApiResponse<Map<String, Object>> mtbf(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String equipCategoryCode) {

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        long totalDays = ChronoUnit.DAYS.between(start, end) + 1;
        long totalMinutes = totalDays * 24 * 60;

        List<MasterEquipment> equipments = getFilteredEquipments(equipCategoryCode);
        List<Long> equipIds = equipments.stream().map(MasterEquipment::getId).toList();
        List<EquipLossEvent> events = fetchEvents(equipIds, start, end);

        // 설비별 이벤트 그룹핑
        Map<Long, List<EquipLossEvent>> eventsByEquip = events.stream()
                .filter(e -> e.getEquipId() != null)
                .collect(Collectors.groupingBy(EquipLossEvent::getEquipId));

        // UCL 조회 (equipCategoryCode 기반)
        int uclMin = getUclValue(equipCategoryCode, true);

        List<Map<String, Object>> equipList = new ArrayList<>();
        List<Map<String, Object>> mtbfValues = new ArrayList<>();

        for (MasterEquipment eq : equipments) {
            Map<String, Object> eqMap = new LinkedHashMap<>();
            eqMap.put("id", eq.getId());
            eqMap.put("unitNumber", eq.getUnitNumber());
            eqMap.put("lineName", eq.getLineName());
            equipList.add(eqMap);

            List<EquipLossEvent> eqEvents = eventsByEquip.getOrDefault(eq.getId(), List.of());
            int failCount = eqEvents.size();
            long totalLossMin = eqEvents.stream()
                    .mapToLong(e -> e.getLossTimeMin() != null ? e.getLossTimeMin() : 0)
                    .sum();

            double mtbfMin = failCount > 0 ? (double) (totalMinutes - totalLossMin) / failCount : totalMinutes;

            Map<String, Object> mv = new LinkedHashMap<>();
            mv.put("equipId", eq.getId());
            mv.put("mtbfMin", Math.round(mtbfMin));
            mv.put("failCount", failCount);
            mv.put("totalLossMin", totalLossMin);
            mtbfValues.add(mv);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipment", equipList);
        result.put("mtbfValues", mtbfValues);
        result.put("ucl", uclMin);
        return ApiResponse.success(result);
    }

    /**
     * ET0080 - MTTR 분석
     * MTTR = 총 Loss 시간 / 고장 건수
     */
    @RequirePermission(menu = "ET0080", action = "read")
    @GetMapping("/mttr")
    public ApiResponse<Map<String, Object>> mttr(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String equipCategoryCode) {

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<MasterEquipment> equipments = getFilteredEquipments(equipCategoryCode);
        List<Long> equipIds = equipments.stream().map(MasterEquipment::getId).toList();
        List<EquipLossEvent> events = fetchEvents(equipIds, start, end);

        Map<Long, List<EquipLossEvent>> eventsByEquip = events.stream()
                .filter(e -> e.getEquipId() != null)
                .collect(Collectors.groupingBy(EquipLossEvent::getEquipId));

        int uclMin = getUclValue(equipCategoryCode, false);

        List<Map<String, Object>> equipList = new ArrayList<>();
        List<Map<String, Object>> mttrValues = new ArrayList<>();

        for (MasterEquipment eq : equipments) {
            Map<String, Object> eqMap = new LinkedHashMap<>();
            eqMap.put("id", eq.getId());
            eqMap.put("unitNumber", eq.getUnitNumber());
            eqMap.put("lineName", eq.getLineName());
            equipList.add(eqMap);

            List<EquipLossEvent> eqEvents = eventsByEquip.getOrDefault(eq.getId(), List.of());
            int failCount = eqEvents.size();
            long totalLossMin = eqEvents.stream()
                    .mapToLong(e -> e.getLossTimeMin() != null ? e.getLossTimeMin() : 0)
                    .sum();

            double mttrMin = failCount > 0 ? (double) totalLossMin / failCount : 0;

            Map<String, Object> mv = new LinkedHashMap<>();
            mv.put("equipId", eq.getId());
            mv.put("mttrMin", Math.round(mttrMin));
            mv.put("failCount", failCount);
            mv.put("totalLossMin", totalLossMin);
            mttrValues.add(mv);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipment", equipList);
        result.put("mttrValues", mttrValues);
        result.put("ucl", uclMin);
        return ApiResponse.success(result);
    }

    // ---------- helpers ----------

    private List<MasterEquipment> getFilteredEquipments(String equipCategoryCode) {
        List<MasterEquipment> all = equipmentRepository.findAllByOrderByIdAsc();
        if (equipCategoryCode != null && !equipCategoryCode.isBlank()) {
            return all.stream()
                    .filter(e -> equipCategoryCode.equals(e.getCategory()))
                    .collect(Collectors.toList());
        }
        return all;
    }

    private List<Long> getFilteredEquipIds(String equipCategoryCode) {
        return getFilteredEquipments(equipCategoryCode).stream()
                .map(MasterEquipment::getId)
                .toList();
    }

    private List<EquipLossEvent> fetchEvents(List<Long> equipIds, LocalDate start, LocalDate end) {
        if (equipIds.isEmpty()) {
            return lossEventRepository.findByFailDateBetween(start, end);
        }
        return lossEventRepository.findByEquipIdInAndFailDateBetween(equipIds, start, end);
    }

    private int getUclValue(String equipCategoryCode, boolean isMtbf) {
        String categoryForLookup = (equipCategoryCode != null && !equipCategoryCode.isBlank())
                ? equipCategoryCode : "ALL";
        Optional<EquipTechInfo> techInfo = techInfoRepository.findByEquipCategoryCode(categoryForLookup);
        if (techInfo.isEmpty()) {
            techInfo = techInfoRepository.findByEquipCategoryCode("ALL");
        }
        return techInfo.map(ti -> isMtbf ? ti.getMtbfUclMin() : ti.getMttrUclMin())
                .orElse(isMtbf ? 720 : 60);
    }
}
