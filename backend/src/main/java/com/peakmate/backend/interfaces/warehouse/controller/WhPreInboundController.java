package com.peakmate.backend.interfaces.warehouse.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.warehouse.entity.WhPreInbound;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.error.EntityNotFoundException;
import com.peakmate.backend.infra.repository.warehouse.WhPreInboundJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/warehouse/pre-inbound")
@RequiredArgsConstructor
public class WhPreInboundController {

    private final WhPreInboundJpaRepository repository;
    private final SystemLogService systemLogService;

    private static final java.util.regex.Pattern PO_NUMBER_PATTERN =
            java.util.regex.Pattern.compile("^[A-Za-z0-9가-힣\\-_]{1,80}$");

    @RequirePermission(menu = "WH0010", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String barcodeNo) {

        List<WhPreInbound> all;

        if (barcodeNo != null && !barcodeNo.isBlank()) {
            all = repository.findByBarcodeNo(barcodeNo.trim())
                    .map(List::of).orElse(List.of());
        } else if (startDate != null && endDate != null) {
            LocalDate start;
            try {
                start = LocalDate.parse(startDate);
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("시작일 형식이 올바르지 않습니다 (YYYY-MM-DD): " + startDate);
            }
            LocalDate end;
            try {
                end = LocalDate.parse(endDate);
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("종료일 형식이 올바르지 않습니다 (YYYY-MM-DD): " + endDate);
            }
            all = repository.findByPreInboundDateBetweenOrderByPreInboundDateDescIdDesc(start, end);
        } else {
            all = repository.findAllByOrderByPreInboundDateDescIdDesc();
        }

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

    @RequirePermission(menu = "WH0010", action = "update")
    @PostMapping("/batch")
    @Transactional
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String lotNo = (String) row.getOrDefault("lotNo", "");
                    if (lotNo != null && !lotNo.isBlank() && repository.findByLotNo(lotNo).isPresent()) {
                        throw new IllegalStateException("이미 등록된 LOT 번호입니다: " + lotNo);
                    }
                    WhPreInbound entity = WhPreInbound.create(
                            lotNo,
                            (String) row.getOrDefault("materialCode", ""),
                            (String) row.getOrDefault("materialName", ""),
                            toBigDecimal(row.get("preInboundQty")),
                            toBigDecimal(row.get("weight")),
                            (String) row.getOrDefault("supplierCode", ""),
                            (String) row.getOrDefault("supplierName", ""),
                            toLocalDate(row.get("preInboundDate")),
                            (String) row.get("barcodeNo"),
                            (String) row.get("poNumber"),
                            (String) row.get("materialType"),
                            (String) row.get("productSpec"),
                            (String) row.get("rawMaterial"),
                            (String) row.get("hardnessType"),
                            (String) row.get("inboundTime"),
                            (String) row.get("inboundSource"),
                            (String) row.get("palletNo"),
                            (String) row.get("locationCd"),
                            (String) row.get("remark")
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    WhPreInbound entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("lotNo", entity.getLotNo()),
                            (String) row.getOrDefault("materialCode", entity.getMaterialCode()),
                            (String) row.getOrDefault("materialName", entity.getMaterialName()),
                            toBigDecimalOrDefault(row.get("preInboundQty"), entity.getPreInboundQty()),
                            toBigDecimalOrDefault(row.get("weight"), entity.getWeight()),
                            (String) row.getOrDefault("supplierCode", entity.getSupplierCode()),
                            (String) row.getOrDefault("supplierName", entity.getSupplierName()),
                            toLocalDateOrDefault(row.get("preInboundDate"), entity.getPreInboundDate()),
                            (String) row.getOrDefault("barcodeNo", entity.getBarcodeNo()),
                            (String) row.getOrDefault("poNumber", entity.getPoNumber()),
                            (String) row.getOrDefault("materialType", entity.getMaterialType()),
                            (String) row.getOrDefault("productSpec", entity.getProductSpec()),
                            (String) row.getOrDefault("rawMaterial", entity.getRawMaterial()),
                            (String) row.getOrDefault("hardnessType", entity.getHardnessType()),
                            (String) row.getOrDefault("inboundTime", entity.getInboundTime()),
                            (String) row.getOrDefault("inboundSource", entity.getInboundSource()),
                            (String) row.getOrDefault("palletNo", entity.getPalletNo()),
                            toBigDecimalOrDefault(row.get("inspectQty"), entity.getInspectQty()),
                            toBigDecimalOrDefault(row.get("diffQty"), entity.getDiffQty()),
                            toBigDecimalOrDefault(row.get("remainQty"), entity.getRemainQty()),
                            (String) row.getOrDefault("locationCd", entity.getLocationCd()),
                            (String) row.getOrDefault("remark", entity.getRemark())
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
        int created = (int) rows.stream().filter(r -> "created".equals(r.get("_rowState"))).count();
        int updated = (int) rows.stream().filter(r -> "updated".equals(r.get("_rowState"))).count();
        int deleted = (int) rows.stream().filter(r -> "deleted".equals(r.get("_rowState"))).count();
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("DATA_IMPORT", null, currentUser, null, "가입고 일괄저장",
                    "생성 " + created + "건, 수정 " + updated + "건, 삭제 " + deleted + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] 가입고 일괄저장", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "WH0010", action = "approve")
    @PostMapping("/approve")
    @Transactional
    public ApiResponse<Void> approve(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("ids", List.of());
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        for (Long id : ids) {
            WhPreInbound entity = repository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("가입고 데이터를 찾을 수 없습니다: " + id));
            entity.approve(currentUser);
            repository.save(entity);
        }
        try {
            systemLogService.log("APPROVAL", null, currentUser, null, "가입고 승인", ids.size() + "건 승인");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] 가입고 승인", e);
        }
        return ApiResponse.success("승인 처리되었습니다");
    }

    @RequirePermission(menu = "WH0010", action = "approve")
    @PostMapping("/cancel-approve")
    @Transactional
    public ApiResponse<Void> cancelApprove(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("ids", List.of());
        for (Long id : ids) {
            WhPreInbound entity = repository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("가입고 데이터를 찾을 수 없습니다: " + id));
            entity.cancelApproval();
            repository.save(entity);
        }
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("APPROVAL_CANCEL", null, currentUser, null, "가입고 승인취소", ids.size() + "건 승인취소");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] 가입고 승인취소", e);
        }
        return ApiResponse.success("승인취소 처리되었습니다");
    }

    @RequirePermission(menu = "WH0010", action = "update")
    @GetMapping("/barcode/generate")
    public ApiResponse<Map<String, Object>> generateBarcode(
            @RequestParam String type,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String poNumber) {

        String prefix;
        if ("po".equals(type)) {
            if (poNumber == null || poNumber.isBlank()) {
                throw new IllegalArgumentException("발주번호를 입력해주세요");
            }
            if (!PO_NUMBER_PATTERN.matcher(poNumber).matches()) {
                throw new IllegalArgumentException("발주번호는 영숫자, 한글, 하이픈, 밑줄만 허용됩니다");
            }
            prefix = poNumber;
        } else {
            if (date == null || date.isBlank()) {
                date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
            } else {
                date = date.replace("-", "");
            }
            prefix = date;
        }

        long count = repository.countByBarcodeNoStartingWith(prefix + "-");
        String barcode;
        if ("po".equals(type)) {
            barcode = WhPreInbound.formatBarcodeByPo(prefix, count + 1);
        } else {
            barcode = WhPreInbound.formatBarcodeByDate(prefix, count + 1);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("barcode", barcode);
        return ApiResponse.success(result);
    }

    @RequirePermission(menu = "WH0010", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(WhPreInbound e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("lotNo", e.getLotNo());
        map.put("materialCode", e.getMaterialCode());
        map.put("materialName", e.getMaterialName());
        map.put("preInboundQty", e.getPreInboundQty());
        map.put("weight", e.getWeight());
        map.put("supplierCode", e.getSupplierCode());
        map.put("supplierName", e.getSupplierName());
        map.put("preInboundDate", e.getPreInboundDate() != null ? e.getPreInboundDate().toString() : null);
        map.put("barcodeNo", e.getBarcodeNo());
        map.put("poNumber", e.getPoNumber());
        map.put("materialType", e.getMaterialType());
        map.put("productSpec", e.getProductSpec());
        map.put("rawMaterial", e.getRawMaterial());
        map.put("hardnessType", e.getHardnessType());
        map.put("inboundTime", e.getInboundTime());
        map.put("inboundSource", e.getInboundSource());
        map.put("palletNo", e.getPalletNo());
        map.put("statusCd", e.getStatusCd());
        map.put("approvalCd", e.getApprovalCd());
        map.put("inspectQty", e.getInspectQty());
        map.put("diffQty", e.getDiffQty());
        map.put("remainQty", e.getRemainQty());
        map.put("locationCd", e.getLocationCd());
        map.put("remark", e.getRemark());
        map.put("approvedBy", e.getApprovedBy());
        map.put("approvedAt", e.getApprovedAt() != null ? e.getApprovedAt().toString() : null);
        map.put("createdBy", e.getCreatedBy());
        return map;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        String s = val.toString().trim();
        if (s.isEmpty()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("숫자 형식이 올바르지 않습니다: " + s);
        }
    }

    private BigDecimal toBigDecimalOrDefault(Object val, BigDecimal defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        String s = val.toString().trim();
        if (s.isEmpty()) return defaultVal;
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("숫자 형식이 올바르지 않습니다: " + s);
        }
    }

    private LocalDate toLocalDate(Object val) {
        if (val == null) return LocalDate.now();
        try {
            return LocalDate.parse(val.toString().trim());
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): " + val);
        }
    }

    private LocalDate toLocalDateOrDefault(Object val, LocalDate defaultVal) {
        if (val == null) return defaultVal;
        String s = val.toString().trim();
        if (s.isEmpty()) return defaultVal;
        try {
            return LocalDate.parse(s);
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): " + s);
        }
    }
}
