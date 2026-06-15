-- 1. master_supplier 데이터를 master_partner로 이관
-- 주의: V55 실행 전에 PartnerPage에서 동일한 partner_code가 등록되었을 수 있음.
-- 해당 경우 NOT EXISTS로 건너뜀 — 이는 의도적 동작 (이미 partner에 존재하면 중복 이관 불필요).
INSERT INTO master_partner (partner_code, partner_name, partner_type, business_category, remark, is_active, created_at, updated_at)
SELECT supplier_code, company_name, 'SUPPLIER', category, item, is_active, created_at, updated_at
FROM master_supplier
WHERE supplier_code IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM master_partner WHERE partner_code = master_supplier.supplier_code)
ON CONFLICT (partner_code) DO NOTHING;

-- 2. wh_pre_inbound의 supplier_code/name 컬럼은 기존 데이터 보존을 위해 유지.
-- 앞으로는 partner 데이터를 참조하도록 프론트/백엔드 코드를 변경하되,
-- 엔티티 필드명(supplierCode/supplierName)은 유지. 실제 참조 대상은 partner임.

-- 3. 사이드바 메뉴에서 협력업체관리(MM0020) 비활성화
UPDATE system_menu SET use_yn = 'N' WHERE menu_code = 'MM0020';
