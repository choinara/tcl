-- 공통코드 그룹에 Extra 컬럼 라벨 필드 추가
ALTER TABLE common_code_group ADD COLUMN extra1_label VARCHAR(100) DEFAULT NULL;
ALTER TABLE common_code_group ADD COLUMN extra2_label VARCHAR(100) DEFAULT NULL;

COMMENT ON COLUMN common_code_group.extra1_label IS '그룹별 Extra1 컬럼 표시명 (NULL이면 Extra1로 표시)';
COMMENT ON COLUMN common_code_group.extra2_label IS '그룹별 Extra2 컬럼 표시명 (NULL이면 Extra2로 표시)';
