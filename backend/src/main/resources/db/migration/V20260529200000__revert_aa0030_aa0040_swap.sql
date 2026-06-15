-- V20260528100000 swap 원복: AA0030(연결) → 수집설정, AA0040(수집설정) → 연결
-- AA0021 sort_order 원복 (9), flyway_schema_history V20260528100000 전체 제거

-- 1. 메뉴코드 스왑 원복 (현재: AA0030=연결/path=connection, AA0040=수집설정/path=collection)
UPDATE system_menu SET menu_code = 'AA0030_TMP' WHERE menu_code = 'AA0030';
UPDATE system_menu SET menu_code = 'AA0030', sort_order = 3 WHERE menu_code = 'AA0040';
UPDATE system_menu SET menu_code = 'AA0040', sort_order = 4 WHERE menu_code = 'AA0030_TMP';

-- 2. AA0021 sort_order 원복 (V20260525210000 원본값 = 9)
UPDATE system_menu SET sort_order = 9 WHERE menu_code = 'AA0021';

-- 3. flyway_schema_history V20260528100000 전체 제거 (파일 없음 + 2회 중복 → 완전 정리)
DELETE FROM flyway_schema_history WHERE version = '20260528100000';
