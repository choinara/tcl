package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterPartner;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterPartnerJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/master/partners")
@RequiredArgsConstructor
public class MasterPartnerController {

    private final MasterPartnerJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0120", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterPartner> all = repository.findAllByOrderByIdAsc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            content = content.stream()
                    .filter(m -> m.values().stream()
                            .anyMatch(v -> v != null && v.toString().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        response.put("totalPages", 1);
        response.put("first", true);
        response.put("last", true);
        return ApiResponse.success(response);
    }

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> findAllActive() {
        List<MasterPartner> all = repository.findByIsActiveOrderByIdAsc("Y");
        return ApiResponse.success(all.stream().map(this::toSimpleMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "MM0120", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String code = (String) row.getOrDefault("partnerCode", "");
                    if (code != null && !code.isBlank() && repository.findByPartnerCode(code).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 업체코드입니다: " + code);
                    }
                    MasterPartner entity = MasterPartner.create(
                            code,
                            (String) row.getOrDefault("partnerName", ""),
                            (String) row.getOrDefault("partnerType", "MIXED"),
                            (String) row.get("businessNumber"),
                            (String) row.get("ceoName"),
                            (String) row.get("businessCategory"),
                            (String) row.get("businessType"),
                            (String) row.get("phone"),
                            (String) row.get("fax"),
                            (String) row.get("email"),
                            (String) row.get("address"),
                            (String) row.get("transactionStatus"),
                            (String) row.get("remark")
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterPartner entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("partnerCode", entity.getPartnerCode()),
                            (String) row.getOrDefault("partnerName", entity.getPartnerName()),
                            (String) row.getOrDefault("partnerType", entity.getPartnerType()),
                            (String) row.getOrDefault("businessNumber", entity.getBusinessNumber()),
                            (String) row.getOrDefault("ceoName", entity.getCeoName()),
                            (String) row.getOrDefault("businessCategory", entity.getBusinessCategory()),
                            (String) row.getOrDefault("businessType", entity.getBusinessType()),
                            (String) row.getOrDefault("phone", entity.getPhone()),
                            (String) row.getOrDefault("fax", entity.getFax()),
                            (String) row.getOrDefault("email", entity.getEmail()),
                            (String) row.getOrDefault("address", entity.getAddress()),
                            (String) row.getOrDefault("transactionStatus", entity.getTransactionStatus()),
                            (String) row.getOrDefault("remark", entity.getRemark()),
                            (String) row.getOrDefault("isActive", entity.getIsActive())
                    );
                    repository.save(entity);
                }
                case "deleted" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    repository.deleteById(id);
                }
            }
        }
        int createdCount = (int) rows.stream().filter(r -> "created".equals(r.get("_rowState"))).count();
        int updatedCount = (int) rows.stream().filter(r -> "updated".equals(r.get("_rowState"))).count();
        int deletedCount = (int) rows.stream().filter(r -> "deleted".equals(r.get("_rowState"))).count();
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "협력사 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0120", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterPartner e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("partnerCode", e.getPartnerCode());
        map.put("partnerName", e.getPartnerName());
        map.put("partnerType", e.getPartnerType());
        map.put("businessNumber", e.getBusinessNumber());
        map.put("ceoName", e.getCeoName());
        map.put("businessCategory", e.getBusinessCategory());
        map.put("businessType", e.getBusinessType());
        map.put("phone", e.getPhone());
        map.put("fax", e.getFax());
        map.put("email", e.getEmail());
        map.put("address", e.getAddress());
        map.put("transactionStatus", e.getTransactionStatus());
        map.put("remark", e.getRemark());
        map.put("isActive", e.getIsActive());
        return map;
    }

    private Map<String, Object> toSimpleMap(MasterPartner e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("partnerCode", e.getPartnerCode());
        map.put("partnerName", e.getPartnerName());
        return map;
    }
}
