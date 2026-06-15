-- 일별생산계획에 고객 컬럼 추가
ALTER TABLE daily_production_plan
    ADD COLUMN customer VARCHAR(50) NOT NULL DEFAULT '';

-- 기존 UK 삭제 후 customer 포함하여 재생성
DROP INDEX IF EXISTS uix_daily_plan_key;
CREATE UNIQUE INDEX uix_daily_plan_key
    ON daily_production_plan (plan_year, plan_month, customer, line_code, product_name, spec, material, plan_type);
