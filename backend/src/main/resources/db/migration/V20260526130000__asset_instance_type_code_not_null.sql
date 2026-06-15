-- asset_instance type_code NOT NULL 제약 복구 (인스턴스는 Asset Type에 귀속)
DELETE FROM asset_instance WHERE type_code IS NULL OR type_code = '';
ALTER TABLE asset_instance ALTER COLUMN type_code SET NOT NULL;
