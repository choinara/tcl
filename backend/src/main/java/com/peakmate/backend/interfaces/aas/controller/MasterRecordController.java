package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.entity.AssetInstanceMenuColConfig;
import com.peakmate.backend.domain.aas.entity.AssetInstanceMenuColConfig.ColKeyEntry;
import com.peakmate.backend.domain.aas.service.AssetDomainService;
import com.peakmate.backend.infra.repository.menu.SystemMenuJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 기준정보 레코드 조회 API (AA0020 LinkMasterModal 전용)
 *
 * SQL Injection 방어: MENU_CONFIG 화이트리스트에 등록된 menuCode만 허용.
 * tableName/컬럼명은 상수에서만 취득 — 사용자 입력값을 SQL에 직접 삽입하지 않는다.
 */
@Slf4j
@RestController
@RequestMapping("/api/aas/master-records")
@RequiredArgsConstructor
public class MasterRecordController {

    private final AssetDomainService assetDomainService;
    private final SystemMenuJpaRepository systemMenuJpaRepository;
    private final EntityManager em;

    // =========================================================================
    // MENU_CONFIG 화이트리스트 (SQL Injection 방어 핵심)
    // =========================================================================

    record ColumnConfig(String key, String label, String dbColumn) {}

    record MasterMenuConfig(String menuCode, String menuName,
                            String tableName, String idColumn,
                            List<ColumnConfig> columns) {}

    private static final Map<String, MasterMenuConfig> MENU_CONFIG;

    static {
        Map<String, MasterMenuConfig> m = new LinkedHashMap<>();

        m.put("MM0010", new MasterMenuConfig("MM0010", "고객관리", "master_customer", "seq_id",
                List.of(
                        new ColumnConfig("customerCode", "고객코드",  "customer_code"),
                        new ColumnConfig("customerName", "고객명",    "customer_name"),
                        new ColumnConfig("country",      "국가",      "country"),
                        new ColumnConfig("isActive",     "사용여부",  "is_active")
                )));

        m.put("MM0050", new MasterMenuConfig("MM0050", "생산설비", "master_equipment", "seq_id",
                List.of(
                        new ColumnConfig("equipCode",        "설비코드",  "equip_code"),
                        new ColumnConfig("category",         "구분",      "category"),
                        new ColumnConfig("unitNumber",       "호기",      "unit_number"),
                        new ColumnConfig("lineName",         "라인",      "line_name"),
                        new ColumnConfig("modelNm",          "모델명",    "model_nm"),
                        new ColumnConfig("manufacturer",     "제조사",    "manufacturer"),
                        new ColumnConfig("purchaseCorpCode", "구매처",    "purchase_corp_code"),
                        new ColumnConfig("installLocation",  "설치위치",  "install_location"),
                        new ColumnConfig("equipTypeCode",    "설비유형",  "equip_type_code")
                )));

        m.put("MM0060", new MasterMenuConfig("MM0060", "원자재", "master_raw_material", "seq_id",
                List.of(
                        new ColumnConfig("materialCode", "자재코드",  "material_code"),
                        new ColumnConfig("materialType", "자재유형",  "material_type"),
                        new ColumnConfig("modelName",    "모델명",    "model_name"),
                        new ColumnConfig("supplierName", "공급업체",  "supplier_name"),
                        new ColumnConfig("isActive",     "사용여부",  "is_active")
                )));

        m.put("MM0070", new MasterMenuConfig("MM0070", "제품", "master_product", "seq_id",
                List.of(
                        new ColumnConfig("modelName",       "모델명",     "model_name"),
                        new ColumnConfig("rawMaterial",     "원자재",     "raw_material"),
                        new ColumnConfig("materialType",    "자재유형",   "material_type"),
                        new ColumnConfig("customerName",    "고객사",     "customer_name"),
                        new ColumnConfig("platingThickness","도금두께",   "plating_thickness"),
                        new ColumnConfig("productSpec",     "사양",       "product_spec"),
                        new ColumnConfig("isActive",        "사용여부",   "is_active")
                )));

        m.put("MM0120", new MasterMenuConfig("MM0120", "협력사관리", "master_partner", "seq_id",
                List.of(
                        new ColumnConfig("partnerCode",      "협력사코드", "partner_code"),
                        new ColumnConfig("partnerName",      "협력사명",   "partner_name"),
                        new ColumnConfig("partnerType",      "구분",       "partner_type"),
                        new ColumnConfig("businessNumber",   "사업자번호", "business_number"),
                        new ColumnConfig("businessCategory", "업태",       "business_category")
                )));

        MENU_CONFIG = Collections.unmodifiableMap(m);
    }

    // =========================================================================
    // API
    // =========================================================================

    /** 팝업 Step 1: 기준정보관리 카테고리 메뉴 목록 */
    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/menus")
    public ApiResponse<List<Map<String, String>>> getMenus() {
        // system_menu에서 use_yn='Y'인 메뉴 중 MENU_CONFIG와 교집합만 반환
        List<Map<String, String>> result = systemMenuJpaRepository
                .findByUseYnOrderBySortOrderAsc("Y")
                .stream()
                .filter(m -> MENU_CONFIG.containsKey(m.getMenuCode()))
                .map(m -> Map.of(
                        "menuCode", m.getMenuCode(),
                        "menuName", MENU_CONFIG.get(m.getMenuCode()).menuName()
                ))
                .collect(Collectors.toList());
        return ApiResponse.success(result);
    }

    /** 팝업 Step 2: 메뉴 스키마 (선택 가능한 컬럼 목록) */
    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/{menuCode}/schema")
    public ApiResponse<List<Map<String, String>>> getSchema(@PathVariable String menuCode) {
        MasterMenuConfig config = MENU_CONFIG.get(menuCode);
        if (config == null)
            return ApiResponse.error("INVALID_MENU", "지원하지 않는 메뉴입니다: " + menuCode);

        List<Map<String, String>> schema = config.columns().stream()
                .map(c -> Map.of("key", c.key(), "label", c.label()))
                .collect(Collectors.toList());
        return ApiResponse.success(schema);
    }

    /** 팝업 Step 3: 레코드 목록 조회 (화이트리스트 기반 native query) */
    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/{menuCode}/records")
    public ApiResponse<Map<String, Object>> getRecords(
            @PathVariable String menuCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        MasterMenuConfig config = MENU_CONFIG.get(menuCode);
        if (config == null)
            return ApiResponse.error("INVALID_MENU", "지원하지 않는 메뉴입니다: " + menuCode);

        // tableName과 컬럼명은 MENU_CONFIG 상수에서만 취득 — 사용자 입력값 아님
        String selectCols = config.columns().stream()
                .map(c -> c.dbColumn() + " AS \"" + c.key() + "\"")
                .collect(Collectors.joining(", "));

        String whereClause = (keyword != null && !keyword.isBlank())
                ? " WHERE " + config.columns().get(0).dbColumn() + "::text ILIKE :kw"
                : "";

        String sql = "SELECT " + config.idColumn() + " AS \"id\", " + selectCols
                + " FROM " + config.tableName()
                + whereClause
                + " ORDER BY " + config.idColumn()
                + " LIMIT :size OFFSET :offset";

        var query = em.createNativeQuery(sql, Object.class);
        if (keyword != null && !keyword.isBlank()) {
            query.setParameter("kw", "%" + keyword + "%");
        }
        query.setParameter("size", size);
        query.setParameter("offset", (long) page * size);

        // count query
        String countSql = "SELECT COUNT(*) FROM " + config.tableName() + whereClause;
        var countQuery = em.createNativeQuery(countSql, Object.class);
        if (keyword != null && !keyword.isBlank()) {
            countQuery.setParameter("kw", "%" + keyword + "%");
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rawRows = query.getResultList();
        Number total = (Number) countQuery.getSingleResult();

        // Object[] → Map<String, Object> 변환
        List<String> keys = new ArrayList<>();
        keys.add("id");
        config.columns().forEach(c -> keys.add(c.key()));

        List<Map<String, Object>> records = rawRows.stream().map(row -> {
            Map<String, Object> map = new LinkedHashMap<>();
            for (int i = 0; i < keys.size(); i++) {
                map.put(keys.get(i), row[i]);
            }
            return map;
        }).collect(Collectors.toList());

        return ApiResponse.success(Map.of("records", records, "total", total.longValue()));
    }

    /** Q7 B안: 메뉴별 컬럼 설정 조회 (없으면 404) */
    @RequirePermission(menu = "AA0020", action = "read")
    @GetMapping("/{menuCode}/col-config")
    public ApiResponse<?> getColConfig(@PathVariable String menuCode) {
        if (!MENU_CONFIG.containsKey(menuCode))
            return ApiResponse.error("INVALID_MENU", "지원하지 않는 메뉴입니다: " + menuCode);

        return assetDomainService.findColConfig(menuCode)
                .map(c -> (ApiResponse<?>) ApiResponse.success(Map.of(
                        "menuCode", c.getMenuCode(),
                        "colKeys", c.getColKeys()
                )))
                .orElse(ApiResponse.error("NOT_FOUND", "컬럼 설정이 없습니다."));
    }

    /** Q7 B안: 메뉴별 컬럼 설정 저장 (UPSERT) */
    @RequirePermission(menu = "AA0020", action = "update")
    @PostMapping("/{menuCode}/col-config")
    public ApiResponse<?> saveColConfig(@PathVariable String menuCode,
                                        @RequestBody ColConfigRequest request) {
        MasterMenuConfig config = MENU_CONFIG.get(menuCode);
        if (config == null)
            return ApiResponse.error("INVALID_MENU", "지원하지 않는 메뉴입니다: " + menuCode);

        if (request.colKeys() == null || request.colKeys().isEmpty())
            return ApiResponse.error("VALIDATION", "컬럼 설정이 비어 있습니다.");
        if (request.colKeys().size() > 5)
            return ApiResponse.error("VALIDATION", "컬럼은 최대 5개입니다.");

        // key가 MENU_CONFIG에 정의된 것인지 검증
        Set<String> validKeys = config.columns().stream()
                .map(ColumnConfig::key).collect(Collectors.toSet());
        for (ColKeyEntry entry : request.colKeys()) {
            if (!validKeys.contains(entry.key()))
                return ApiResponse.error("VALIDATION", "유효하지 않은 컬럼 키입니다: " + entry.key());
        }

        AssetInstanceMenuColConfig saved = assetDomainService.upsertColConfig(menuCode, request.colKeys());
        return ApiResponse.success(Map.of(
                "menuCode", saved.getMenuCode(),
                "colKeys", saved.getColKeys()
        ));
    }

    public record ColConfigRequest(List<ColKeyEntry> colKeys) {}
}
