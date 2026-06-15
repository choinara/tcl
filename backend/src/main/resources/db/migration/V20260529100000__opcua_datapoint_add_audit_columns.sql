-- opcua_data_point 테이블에 AuditableEntity 필수 컬럼 추가
-- V59__audit_created_by_updated_by.sql 누락분
ALTER TABLE opcua_data_point
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);
