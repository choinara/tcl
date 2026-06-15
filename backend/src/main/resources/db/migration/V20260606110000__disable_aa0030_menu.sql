-- AA0030 데이터 수집설정 메뉴 비활성화 (AA0031 수집항목 관리로 대체)
UPDATE system_menu SET use_yn = 'N' WHERE menu_code = 'AA0030';
