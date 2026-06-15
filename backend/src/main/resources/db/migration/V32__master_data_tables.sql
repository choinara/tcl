-- =============================================
-- V32: 기준정보관리 마스터 데이터 테이블 생성
-- =============================================

-- 1. master_customer (고객관리)
CREATE TABLE IF NOT EXISTS master_customer (
    seq_id       BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    location     VARCHAR(500),
    is_active    VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. master_supplier (협력업체관리)
CREATE TABLE IF NOT EXISTS master_supplier (
    seq_id       BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    category     VARCHAR(50),
    item         VARCHAR(200),
    is_active    VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. master_standard_time (표준시간관리)
CREATE TABLE IF NOT EXISTS master_standard_time (
    seq_id         BIGSERIAL PRIMARY KEY,
    category       VARCHAR(50),
    item_name      VARCHAR(200) NOT NULL,
    standard_hours NUMERIC(10,2),
    is_active      VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. master_process_chemical (공정별약품)
CREATE TABLE IF NOT EXISTS master_process_chemical (
    seq_id       BIGSERIAL PRIMARY KEY,
    category     VARCHAR(50),
    process_name VARCHAR(200) NOT NULL,
    product_name VARCHAR(200),
    is_active    VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. master_equipment (생산설비)
CREATE TABLE IF NOT EXISTS master_equipment (
    seq_id      BIGSERIAL PRIMARY KEY,
    category    VARCHAR(50),
    unit_number VARCHAR(50),
    line_name   VARCHAR(100),
    max_speed   NUMERIC(10,2),
    is_active   VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. master_raw_material (원자재)
CREATE TABLE IF NOT EXISTS master_raw_material (
    seq_id        BIGSERIAL PRIMARY KEY,
    material_type VARCHAR(100),
    model_name    VARCHAR(200),
    supplier_name VARCHAR(200),
    raw_material  VARCHAR(200),
    product_spec  VARCHAR(200),
    hardness_type VARCHAR(50),
    is_active     VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- 7. master_product (제품)
CREATE TABLE IF NOT EXISTS master_product (
    seq_id                    BIGSERIAL PRIMARY KEY,
    model_name                VARCHAR(200),
    raw_material              VARCHAR(200),
    material_type             VARCHAR(100),
    customer_name             VARCHAR(200),
    plating_thickness         VARCHAR(100),
    product_spec              VARCHAR(200),
    process_rolling           VARCHAR(1) DEFAULT 'N',
    process_plating           VARCHAR(1) DEFAULT 'N',
    process_heat_treatment    VARCHAR(1) DEFAULT 'N',
    process_surface_treatment VARCHAR(1) DEFAULT 'N',
    process_packaging         VARCHAR(1) DEFAULT 'N',
    thickness                 VARCHAR(100),
    width                     VARCHAR(100),
    unit_conversion           NUMERIC(10,4),
    is_active                 VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at                TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                TIMESTAMP NOT NULL DEFAULT now()
);

-- 8. master_production_rate (시간당생산량)
CREATE TABLE IF NOT EXISTS master_production_rate (
    seq_id          BIGSERIAL PRIMARY KEY,
    raw_material    VARCHAR(200),
    model_name      VARCHAR(200),
    product_spec    VARCHAR(200),
    material_type   VARCHAR(100),
    customer_name   VARCHAR(200),
    unit_conversion NUMERIC(10,4),
    rate_4m         NUMERIC(10,2),
    rate_6m         NUMERIC(10,2),
    rate_8m         NUMERIC(10,2),
    is_active       VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 9. master_quality_standard (품질기준정보)
CREATE TABLE IF NOT EXISTS master_quality_standard (
    seq_id              BIGSERIAL PRIMARY KEY,
    customer_name       VARCHAR(200),
    category            VARCHAR(100),
    variety             VARCHAR(200),
    surface_treatment   VARCHAR(200),
    spec_thickness      VARCHAR(100),
    spec_width          VARCHAR(100),
    spec_burr           VARCHAR(100),
    spec_camber         VARCHAR(100),
    spec_elongation     VARCHAR(100),
    spec_tensile_strength VARCHAR(100),
    spec_hardness       VARCHAR(100),
    spec_roughness      VARCHAR(100),
    spec_resistivity    VARCHAR(100),
    spec_plating_thickness VARCHAR(100),
    spec_plating_purity VARCHAR(100),
    spec_appearance     VARCHAR(200),
    spec_packing        VARCHAR(200),
    spec_core           VARCHAR(200),
    spec_extra1         VARCHAR(200),
    spec_extra2         VARCHAR(200),
    is_active           VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- 10. master_quality_spec (품종별Spec)
CREATE TABLE IF NOT EXISTS master_quality_spec (
    seq_id          BIGSERIAL PRIMARY KEY,
    customer_name   VARCHAR(200),
    classification  VARCHAR(200),
    anode_spec      VARCHAR(500),
    cathode_spec    VARCHAR(500),
    is_active       VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- 11. master_appearance_inspection (외관검사항목)
CREATE TABLE IF NOT EXISTS master_appearance_inspection (
    seq_id      BIGSERIAL PRIMARY KEY,
    defect_name VARCHAR(200) NOT NULL,
    category    VARCHAR(100),
    requirement VARCHAR(500),
    is_active   VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
