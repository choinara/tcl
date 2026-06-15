package com.peakmate.backend.domain.commoncode.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 공통코드 값이 다른 테이블에서 사용되고 있는지 확인하는 서비스.
 *
 * <p>USAGE_MAP은 반드시 소스코드 내 상수로만 관리한다.
 * 외부 입력(DB, 설정 파일, API 파라미터)을 받지 않는다.
 * SQL Injection 방어를 위해 테이블명/컬럼명은 화이트리스트로만 허용한다.</p>
 */
@Service
public class CommonCodeUsageChecker {

    private static final Map<String, List<String[]>> USAGE_MAP = Map.ofEntries(
            Map.entry("PARTNER_TYPE", List.<String[]>of(new String[]{"master_partner", "partner_type"})),
            Map.entry("TRANSACTION_STATUS", List.<String[]>of(new String[]{"master_partner", "transaction_status"})),
            Map.entry("WH_STATUS", List.<String[]>of(new String[]{"wh_pre_inbound", "status_cd"})),
            Map.entry("WH_APPROVAL", List.<String[]>of(new String[]{"wh_pre_inbound", "approval_cd"})),
            Map.entry("APS_SHIFT_TYPE", List.<String[]>of(
                    new String[]{"aps_capacity_slot", "shift"},
                    new String[]{"aps_schedule_draft", "shift"})),
            Map.entry("APS_CREW_CODE", List.<String[]>of(
                    new String[]{"aps_capacity_slot", "crew"},
                    new String[]{"aps_schedule_draft", "crew"}))
    );

    private static final Set<String> ALLOWED_TABLES;
    private static final Set<String> ALLOWED_COLUMNS;

    static {
        Set<String> tables = new HashSet<>();
        Set<String> columns = new HashSet<>();
        USAGE_MAP.values().forEach(list -> list.forEach(tc -> {
            tables.add(tc[0]);
            columns.add(tc[1]);
        }));
        ALLOWED_TABLES = Set.copyOf(tables);
        ALLOWED_COLUMNS = Set.copyOf(columns);
    }

    private final JdbcTemplate jdbcTemplate;

    public CommonCodeUsageChecker(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isCodeInUse(String groupCode, String codeValue) {
        List<String[]> tables = USAGE_MAP.get(groupCode);
        if (tables == null) return false;

        for (String[] tableCol : tables) {
            if (!ALLOWED_TABLES.contains(tableCol[0]) || !ALLOWED_COLUMNS.contains(tableCol[1])) {
                throw new IllegalStateException("허용되지 않은 테이블/컬럼: " + tableCol[0] + "." + tableCol[1]);
            }
            String sql = "SELECT COUNT(*) FROM " + tableCol[0] + " WHERE " + tableCol[1] + " = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codeValue);
            if (count != null && count > 0) return true;
        }
        return false;
    }
}
