package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipLossEvent;
import com.peakmate.backend.domain.master.entity.MasterEquipment;
import com.peakmate.backend.infra.repository.equiptech.EquipLossEventJpaRepository;
import com.peakmate.backend.infra.repository.master.MasterEquipmentJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/et/monitor")
@RequiredArgsConstructor
public class EquipDashboardController {

    private final EquipLossEventJpaRepository lossEventRepository;
    private final MasterEquipmentJpaRepository equipmentRepository;

    @RequirePermission(menu = "ET0120", action = "read")
    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(
            @RequestParam(required = false) String equipCategoryCode) {

        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.now();

        List<MasterEquipment> equipments = getFilteredEquipments(equipCategoryCode);
        List<Long> ids = equipments.stream().map(MasterEquipment::getId).toList();

        List<EquipLossEvent> todayEvents = ids.isEmpty()
                ? lossEventRepository.findByFailDateBetween(today, today)
                : lossEventRepository.findByEquipIdInAndFailDateBetween(ids, today, today);

        List<EquipLossEvent> monthEvents = ids.isEmpty()
                ? lossEventRepository.findByFailDateBetween(ym.atDay(1), ym.atEndOfMonth())
                : lossEventRepository.findByEquipIdInAndFailDateBetween(ids, ym.atDay(1), ym.atEndOfMonth());

        Map<Long, List<EquipLossEvent>> byEquip = todayEvents.stream()
                .filter(e -> e.getEquipId() != null)
                .collect(Collectors.groupingBy(EquipLossEvent::getEquipId));

        List<Map<String, Object>> equipStatus = new ArrayList<>();
        int runningCount = 0, faultCount = 0, idleCount = 0;
        long totalLossToday = 0;
        double totalOee = 0;

        for (MasterEquipment eq : equipments) {
            List<EquipLossEvent> events = byEquip.getOrDefault(eq.getId(), List.of());
            long lossMin = events.stream()
                    .mapToLong(e -> e.getLossTimeMin() != null ? e.getLossTimeMin() : 0)
                    .sum();
            int failCountToday = events.size();

            String status;
            if (lossMin > 60) status = "FAULT";
            else if (lossMin > 0) status = "IDLE";
            else status = "RUNNING";

            double oee = Math.min(100.0, Math.max(0.0, (1.0 - lossMin / 480.0) * 100.0));

            if ("RUNNING".equals(status)) runningCount++;
            else if ("FAULT".equals(status)) faultCount++;
            else idleCount++;
            totalLossToday += lossMin;
            totalOee += oee;

            Map<String, Object> es = new LinkedHashMap<>();
            es.put("equipId", eq.getId());
            es.put("unitNumber", eq.getUnitNumber());
            es.put("lineName", eq.getLineName());
            es.put("status", status);
            es.put("oeePercent", Math.round(oee * 10.0) / 10.0);
            es.put("todayLossMin", lossMin);
            es.put("failCountToday", failCountToday);
            equipStatus.add(es);
        }

        double avgOee = equipments.isEmpty() ? 0.0
                : Math.round(totalOee / equipments.size() * 10.0) / 10.0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEquip", equipments.size());
        summary.put("runningCount", runningCount);
        summary.put("faultCount", faultCount);
        summary.put("idleCount", idleCount);
        summary.put("avgOee", avgOee);
        summary.put("totalLossToday", totalLossToday);
        summary.put("failCountThisMonth", monthEvents.size());
        summary.put("simulationMode", true);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("equipStatus", equipStatus);
        return ApiResponse.success(result);
    }

    private List<MasterEquipment> getFilteredEquipments(String equipCategoryCode) {
        List<MasterEquipment> all = equipmentRepository.findAllByOrderByIdAsc();
        if (equipCategoryCode != null && !equipCategoryCode.isBlank()) {
            return all.stream()
                    .filter(e -> equipCategoryCode.equals(e.getCategory()))
                    .collect(Collectors.toList());
        }
        return all;
    }
}
