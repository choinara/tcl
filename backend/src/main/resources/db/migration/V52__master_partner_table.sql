-- 협력사 마스터 테이블
CREATE TABLE public.master_partner (
    seq_id bigint NOT NULL,
    partner_code character varying(50) NOT NULL,
    partner_name character varying(200) NOT NULL,
    partner_type character varying(30) NOT NULL,
    business_number character varying(20),
    ceo_name character varying(100),
    business_category character varying(100),
    business_type character varying(100),
    phone character varying(20),
    fax character varying(20),
    email character varying(200),
    address character varying(500),
    transaction_status character varying(20) DEFAULT 'ACTIVE',
    remark character varying(1000),
    is_active character varying(1) DEFAULT 'Y' NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.master_partner_seq_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.master_partner_seq_id_seq OWNED BY public.master_partner.seq_id;
ALTER TABLE ONLY public.master_partner
    ALTER COLUMN seq_id SET DEFAULT nextval('public.master_partner_seq_id_seq'::regclass);
ALTER TABLE ONLY public.master_partner
    ADD CONSTRAINT master_partner_pkey PRIMARY KEY (seq_id);
ALTER TABLE ONLY public.master_partner
    ADD CONSTRAINT master_partner_code_unique UNIQUE (partner_code);

-- 기준정보관리 메뉴에 협력사관리 추가
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0120', '협력사관리', '/master/partner', 'Handshake', 12, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT';

-- SUPER_ADMIN, ADMIN 역할에 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'MM0120' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN');
