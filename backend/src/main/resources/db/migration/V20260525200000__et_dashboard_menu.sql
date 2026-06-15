-- ET0120 설비 종합 대시보드 메뉴 등록

INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0120', '설비 종합 대시보드', '/et/dashboard', 'monitor', 12, 'Y', 2, m.seq_id
FROM system_menu m
WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN) — 읽기 전용 대시보드
INSERT INTO menu_role_permission
    (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'N', 'N', 'N', 'N', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0120'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- i18n (메뉴명 7개 언어 + 페이지 번역 키 ko/en)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0120', '설비 종합 대시보드'),
('en', 'menu.ET0120', 'Equipment Dashboard'),
('ja', 'menu.ET0120', '設備総合ダッシュボード'),
('zh', 'menu.ET0120', '设备综合看板'),
('vi', 'menu.ET0120', 'Equipment Dashboard'),
('id', 'menu.ET0120', 'Equipment Dashboard'),
('th', 'menu.ET0120', 'Equipment Dashboard'),
('ko', 'page.equipDashboard.allCategory', '전체 설비구분'),
('en', 'page.equipDashboard.allCategory', 'All Category'),
('ko', 'page.equipDashboard.search', '조회'),
('en', 'page.equipDashboard.search', 'Search'),
('ko', 'page.equipDashboard.updating', '갱신 중...'),
('en', 'page.equipDashboard.updating', 'Updating...'),
('ko', 'page.equipDashboard.simulationNotice', '시뮬레이션 데이터 — OPC-UA 실제 연결 전 설비 Loss 이벤트 기반 추정값'),
('en', 'page.equipDashboard.simulationNotice', 'Simulation data — estimated from equipment loss events before OPC-UA connection'),
('ko', 'page.equipDashboard.lastUpdated', '마지막 갱신'),
('en', 'page.equipDashboard.lastUpdated', 'Last updated'),
('ko', 'page.equipDashboard.autoRefresh', '30초마다 자동 갱신'),
('en', 'page.equipDashboard.autoRefresh', 'Auto-refresh every 30s'),
('ko', 'page.equipDashboard.kpiTotalEquip', '전체 설비'),
('en', 'page.equipDashboard.kpiTotalEquip', 'Total Equip'),
('ko', 'page.equipDashboard.kpiRunning', '가동'),
('en', 'page.equipDashboard.kpiRunning', 'Running'),
('ko', 'page.equipDashboard.kpiFault', '이상'),
('en', 'page.equipDashboard.kpiFault', 'Fault'),
('ko', 'page.equipDashboard.kpiIdle', '대기'),
('en', 'page.equipDashboard.kpiIdle', 'Idle'),
('ko', 'page.equipDashboard.kpiAvgOee', '평균 OEE'),
('en', 'page.equipDashboard.kpiAvgOee', 'Avg OEE'),
('ko', 'page.equipDashboard.kpiTodayLoss', '오늘 Loss'),
('en', 'page.equipDashboard.kpiTodayLoss', 'Today Loss'),
('ko', 'page.equipDashboard.kpiMonthFail', '이번달 고장'),
('en', 'page.equipDashboard.kpiMonthFail', 'Monthly Faults'),
('ko', 'page.equipDashboard.statusRunning', '가동'),
('en', 'page.equipDashboard.statusRunning', 'Running'),
('ko', 'page.equipDashboard.statusFault', '이상'),
('en', 'page.equipDashboard.statusFault', 'Fault'),
('ko', 'page.equipDashboard.statusIdle', '대기'),
('en', 'page.equipDashboard.statusIdle', 'Idle'),
('ko', 'page.equipDashboard.todayLoss', '오늘 Loss'),
('en', 'page.equipDashboard.todayLoss', 'Today Loss'),
('ko', 'page.equipDashboard.failCount', '고장'),
('en', 'page.equipDashboard.failCount', 'Faults')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
