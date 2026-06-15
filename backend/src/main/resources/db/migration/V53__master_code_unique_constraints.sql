-- 고객 코드 유니크
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_code
ON master_customer (customer_code) WHERE customer_code IS NOT NULL;

-- 제품 모델명+고객 복합 유니크
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_customer
ON master_product (model_name, customer_name)
WHERE model_name IS NOT NULL AND customer_name IS NOT NULL;

-- 설비 호기+라인 복합 유니크
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_unit_line
ON master_equipment (unit_number, line_name)
WHERE unit_number IS NOT NULL AND line_name IS NOT NULL;
