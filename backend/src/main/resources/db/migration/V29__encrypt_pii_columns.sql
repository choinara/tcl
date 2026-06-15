-- V29: 개인정보 암호화 저장을 위한 컬럼 길이 확장
-- AES-256-GCM 암호화 후 Base64 인코딩 + "ENC:" 접두사로 인해 원본보다 길어짐

-- admin_user: 전화번호, 우편번호, 주소
ALTER TABLE admin_user ALTER COLUMN phone_number TYPE VARCHAR(200);
ALTER TABLE admin_user ALTER COLUMN postal_code TYPE VARCHAR(200);
ALTER TABLE admin_user ALTER COLUMN address_base TYPE VARCHAR(1000);
ALTER TABLE admin_user ALTER COLUMN address_detail TYPE VARCHAR(1000);

-- admin_user_bank_account: 계좌번호, 예금주
ALTER TABLE admin_user_bank_account ALTER COLUMN account_number TYPE VARCHAR(200);
ALTER TABLE admin_user_bank_account ALTER COLUMN account_holder TYPE VARCHAR(300);
