-- =============================================================================
-- V91: dev_task 테이블 + 공통코드 + 시드 데이터 (참조용 — Flyway 미사용)
-- =============================================================================

-- 1. dev_task 테이블
CREATE TABLE IF NOT EXISTS dev_task (
    seq_id              BIGSERIAL PRIMARY KEY,
    task_code           VARCHAR(10)  NOT NULL,
    original_no         VARCHAR(10),
    task_name           VARCHAR(500) NOT NULL,
    task_group          VARCHAR(50)  NOT NULL,
    dev_type            VARCHAR(50)  NOT NULL,
    priority            VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    phase               VARCHAR(20),
    proposer            VARCHAR(100),
    assignee            VARCHAR(100),
    related_menu_code   VARCHAR(20),
    description         TEXT,
    completion_criteria TEXT,
    planned_start       VARCHAR(10),
    planned_end         VARCHAR(10),
    actual_start_date   DATE,
    actual_end_date     DATE,
    progress            INTEGER      NOT NULL DEFAULT 0,
    remarks             TEXT,
    use_yn              CHAR(1)      NOT NULL DEFAULT 'Y',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(50),
    updated_by          VARCHAR(50),
    CONSTRAINT uq_dev_task_task_code UNIQUE (task_code)
);

-- 2. 공통코드 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('TASK_STATUS', '과제상태', '개발 과제 진행 상태', 'Y', 33)
ON CONFLICT DO NOTHING;

INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('TASK_GROUP', '과제그룹', '개발 과제 기능 그룹', 'Y', 34)
ON CONFLICT DO NOTHING;

INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('TASK_DEV_TYPE', '개발유형', '개발 과제 개발 유형', 'Y', 35)
ON CONFLICT DO NOTHING;

-- 3. TASK_STATUS 공통코드 (group_id는 실행 환경에 따라 조정 필요)
-- group_id = (SELECT seq_id FROM common_code_group WHERE group_code = 'TASK_STATUS')
INSERT INTO common_code (group_id, code, code_name, sort_order, use_yn)
SELECT g.seq_id, v.code, v.code_name, v.sort_order, 'Y'
FROM common_code_group g,
     (VALUES ('PENDING', '대기', 1), ('IN_PROGRESS', '진행중', 2), ('COMPLETED', '완료', 3),
             ('ON_HOLD', '보류', 4), ('CANCELLED', '취소', 5)) AS v(code, code_name, sort_order)
WHERE g.group_code = 'TASK_STATUS'
ON CONFLICT DO NOTHING;

-- 4. TASK_GROUP 공통코드
INSERT INTO common_code (group_id, code, code_name, sort_order, use_yn)
SELECT g.seq_id, v.code, v.code_name, v.sort_order, 'Y'
FROM common_code_group g,
     (VALUES ('INFRA', '공통 인프라', 1), ('EMAIL_AUTO', '이메일 자동화', 2),
             ('FREIGHT_SCHEDULE', '운임/스케줄', 3), ('SALES_SUPPORT', '영업 지원/분석', 4),
             ('AI_CAPABILITY', 'AI 역량 강화', 5), ('SYSTEM_INTEG', '시스템 통합/포털', 6),
             ('TRACKING_ALERT', '트랙킹/알림', 7), ('CUSTOMS_HSCODE', '통관/HS CODE', 8),
             ('TRANSLATION', '번역/커뮤니케이션', 9)) AS v(code, code_name, sort_order)
WHERE g.group_code = 'TASK_GROUP'
ON CONFLICT DO NOTHING;

-- 5. TASK_DEV_TYPE 공통코드 (13종)
INSERT INTO common_code (group_id, code, code_name, sort_order, use_yn)
SELECT g.seq_id, v.code, v.code_name, v.sort_order, 'Y'
FROM common_code_group g,
     (VALUES ('RPA', 'RPA 자동화', 1), ('AI_AGENT', 'AI 에이전트', 2), ('AI_RAG', 'AI RAG', 3),
             ('API', 'API 연동', 4), ('SYSTEM_DEV', '시스템 개발', 5), ('COMMERCIAL', '상용 서비스', 6),
             ('ENV_SETUP', '환경 준비', 7), ('MEETING', '업무 협의', 8),
             ('AI_AGENT_API', 'AI 에이전트+API', 9), ('AI_RAG_API', 'AI RAG+API', 10),
             ('RPA_AI', 'RPA+AI', 11), ('RPA_API', 'RPA+API', 12), ('API_RPA', 'API+RPA', 13)) AS v(code, code_name, sort_order)
WHERE g.group_code = 'TASK_DEV_TYPE'
ON CONFLICT DO NOTHING;

-- 6. 시드 데이터 (54건 — xlsx 파싱 결과)
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('A1', NULL, '전체 과제 관리 어드민 백엔드 개발', 'INFRA', 'SYSTEM_DEV', 'MEDIUM', 'PENDING', 'PHASE_1', '개발팀', 'D+1', 'D+2', 0, 'D+1~2 (2개월)', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('A2', NULL, '메일 환경 세팅 (IMAP 접속, 계정, 보안 승인)', 'INFRA', 'ENV_SETUP', 'MEDIUM', 'PENDING', 'PHASE_1', 'IT+각지사', 'D+1', 'D+1', 0, 'D+1 (환경 세팅)', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('A3', NULL, 'ELSA 접근 방식 협의 시작 (API/DB/웹)', 'INFRA', 'MEETING', 'MEDIUM', 'PENDING', 'PHASE_1', 'PM+IT+ELSA담당', 'D+1', 'D+3', 0, '블로킹 아님, 병행 협의', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('1', '1', '이메일 자동 분류 (도메인별)', 'EMAIL_AUTO', 'RPA', 'HIGH', 'PENDING', 'PHASE_1', '경영지원', 'D+2', 'D+3', 0, '아웃룩 VBA 기반', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('2', '17', '수신 메일 1차 자동 회신', 'EMAIL_AUTO', 'AI_AGENT', 'HIGH', 'PENDING', 'PHASE_1', '상해지사', 'D+3', 'D+4', 0, '배정 룰 테이블 필요', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('3', '28', '광고메일 수신자 맞춤 발송 (BCC 제거)', 'EMAIL_AUTO', 'RPA', 'HIGH', 'PENDING', 'PHASE_1', '서울영업', 'D+2', 'D+3', 0, '수신자 테이블 구축', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('4', '29', '광고메일 발송 후 2차 피드백 문의 메일 자동 발송', 'EMAIL_AUTO', 'AI_AGENT', 'HIGH', 'PENDING', 'PHASE_1', '서울영업', 'D+3', 'D+4', 0, '발송 이력 추적', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('5', '추가', '이메일 내 자유 검색, 내용 추출 및 요약 (AI 질의응답)', 'EMAIL_AUTO', 'AI_RAG', 'HIGH', 'PENDING', 'PHASE_1', '미팅시 추가', 'D+3', 'D+4', 0, 'RAG 인덱싱 핵심', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('6', '19', '여러 계정 수신 동일 메일 중복 제거', 'EMAIL_AUTO', 'RPA', 'LOW', 'PENDING', 'PHASE_1', '상해/심천지사', 'D+2', 'D+2', 0, '메일 환경과 동시 처리', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('7', '56', '두 계정(tclsz/sales) 중복 수신 메일 자동 읽음 처리', 'EMAIL_AUTO', 'RPA', 'LOW', 'PENDING', 'PHASE_1', '심천지사', 'D+2', 'D+2', 0, '6번과 동일 유형', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('8', '3', '각 터미널 모선 스케줄 지연 확인', 'FREIGHT_SCHEDULE', 'RPA_API', 'HIGH', 'PENDING', 'PHASE_2A', '경영지원', 'D+5', 'D+5', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('9', '10', '회사 업무 절차 문의 챗봇', 'AI_CAPABILITY', 'AI_RAG', 'HIGH', 'PENDING', 'PHASE_2A', '경영지원', 'D+5', 'D+6', 0, '업무 매뉴얼 디지털화 선행', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('10', '48', '견적서 자동 생성', 'AI_CAPABILITY', 'AI_AGENT', 'HIGH', 'PENDING', 'PHASE_2A', '공통의제', 'D+5', 'D+6', 0, '전사 공통 / 운임 DB 필요', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('11', '41', '메인 구간 선사별 운임 매주 자동 업데이트', 'FREIGHT_SCHEDULE', 'RPA', 'LOW', 'PENDING', 'PHASE_2A', '서울전략', 'D+5', 'D+5', 0, '스크래핑: 정형 반복', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('12', '43', '매일 오전 8시 출항 모선 리스트 공유', 'FREIGHT_SCHEDULE', 'RPA', 'LOW', 'PENDING', 'PHASE_2A', '서울전략', 'D+5', 'D+5', 0, '스크래핑: 정형 반복', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('13', '2', '잠재고객사에 운임 이메일 자동 발송', 'SALES_SUPPORT', 'AI_AGENT', 'HIGH', 'PENDING', 'PHASE_2A', '경영지원', 'D+6', 'D+6', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('14', '14', '신규업체 영업방문 전 업체 사전 조사 자동화', 'SALES_SUPPORT', 'AI_AGENT', 'HIGH', 'PENDING', 'PHASE_2A', '경영지원', 'D+6', 'D+6', 0, '공공API 활용', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('15', '49', '아웃룩 연동: 필요정보 입력 시 기존 자료 자동 발췌/정리', 'SYSTEM_INTEG', 'AI_RAG', 'HIGH', 'PENDING', 'PHASE_2A', 'JNB서울', 'D+6', 'D+7', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('16', '15', '선사 양식별 딜레이 노티스 자동 생성', 'FREIGHT_SCHEDULE', 'AI_AGENT', 'MEDIUM', 'PENDING', 'PHASE_2A', '상해지사', 'D+6', 'D+7', 0, '스케줄 데이터 연동', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('17', '51', '국내 지역별 입출항 선사 스케줄 정리 (엑셀 자동 출력)', 'FREIGHT_SCHEDULE', 'RPA_API', 'LOW', 'PENDING', 'PHASE_2A', 'JNB서울', 'D+6', 'D+6', 0, '스크래핑: 정형 반복', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('18', '16', '태풍/안개 등 날씨이슈 발생 시 자동 알림', 'FREIGHT_SCHEDULE', 'RPA_API', 'LOW', 'PENDING', 'PHASE_2A', '상해지사', 'D+6', 'D+6', 0, '기상 API 호출', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('19', '27', '방문 예정 파트너 입력 시 근처 파트너 리스트 안내', 'SALES_SUPPORT', 'AI_AGENT_API', 'HIGH', 'PENDING', 'PHASE_2A', '서울영업', 'D+7', 'D+7', 0, 'GIS/지도 API', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('20', '62', '빅데이터 학습 기반 표준화 업무 매뉴얼 자동 생성', 'TRACKING_ALERT', 'AI_RAG', 'HIGH', 'PENDING', 'PHASE_2A', '심천지사', 'D+7', 'D+7', 0, '업무 인수인계용', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('21', '20', 'ATD 당일 모선 출항 정보 자동 메일 발송 (Pre-Alert)', 'FREIGHT_SCHEDULE', 'RPA_API', 'MEDIUM', 'PENDING', 'PHASE_2A', '상해지사', 'D+7', 'D+7', 0, 'ELSA 연동', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('22', '57', '단순 견적 문의 자동 처리 + 거래량 기반 견적 차별화', 'SALES_SUPPORT', 'AI_AGENT', 'MEDIUM', 'PENDING', 'PHASE_2A', '심천지사', 'D+7', 'D+7', 0, '견적 운임 테이블 필요', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('23', '52', '특정 선박 항차/PORT 입력 시 입출항 변경 자동 알림', 'FREIGHT_SCHEDULE', 'RPA_API', 'LOW', 'PENDING', 'PHASE_2A', 'JNB서울', 'D+7', 'D+7', 0, '스케줄러 기반', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('24', '60', '카고 레디 일정 기준 선사 스케줄/컨테이너 자동 조회', 'FREIGHT_SCHEDULE', 'RPA_API', 'LOW', 'PENDING', 'PHASE_2A', '심천지사', 'D+7', 'D+7', 0, '스크래핑', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('25', '12', '선사 사이트 부킹/SR 자동 입력', 'SYSTEM_INTEG', 'RPA', 'HIGH', 'PENDING', 'PHASE_2B', '경영지원', 'D+8', 'D+8', 0, '보안 검토 완료 전제', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('26', '50', '아웃룩 연동: 선사 운임 메일 -> 견적서 변환', 'SYSTEM_INTEG', 'AI_AGENT', 'MEDIUM', 'PENDING', 'PHASE_2B', 'JNB서울', 'D+8', 'D+8', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('27', '7', 'Pre-Alert 자동 발송', 'TRACKING_ALERT', 'RPA_API', 'MEDIUM', 'PENDING', 'PHASE_2B', '경영지원', 'D+8', 'D+8', 0, '출항 정보 수집 체계', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('28', '32', '국가별/HS CODE별 관부과세 자동 안내', 'CUSTOMS_HSCODE', 'API', 'MEDIUM', 'PENDING', 'PHASE_2B', '서울영업', 'D+8', 'D+8', 0, '관세청 API', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('29', '4', '각 구간 운임 취합 후 트렌드 분석 자동 추출', 'FREIGHT_SCHEDULE', 'AI_RAG', 'LOW', 'PENDING', 'PHASE_2B', '경영지원', 'D+8', 'D+8', 0, 'RAW DATA 진행 중', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('30', '11', '아이템 입력 시 파트너사 통관 회신 문구 자동 생성', 'CUSTOMS_HSCODE', 'AI_RAG', 'LOW', 'PENDING', 'PHASE_2B', '경영지원', 'D+8', 'D+8', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('31', '추가', 'T/S 화물 선적 완료 여부 스케줄러 지속 체크/ DEM,DET 위험감지 포함', 'FREIGHT_SCHEDULE', 'RPA_API', 'MEDIUM', 'PENDING', 'PHASE_2B', '미팅시 추가', 'D+9', 'D+9', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('32', '58', '주/월간 컴플레인 케이스 자동 분석 및 솔루션 제공', 'SALES_SUPPORT', 'AI_RAG', 'MEDIUM', 'PENDING', 'PHASE_2B', '심천지사', 'D+9', 'D+9', 0, '메일 FLAG 기반', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('33', '54', '신규 거래처 수입/수출 이력 및 신용도 자동 조사', 'CUSTOMS_HSCODE', 'API', 'MEDIUM', 'PENDING', 'PHASE_2B', 'JNB서울', 'D+9', 'D+9', 0, '공공 API', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('34', '59', '중국어 메일 -> 한국어+현지 언어 자동 동시 번역 발송', 'TRANSLATION', 'API_RPA', 'MEDIUM', 'PENDING', 'PHASE_2B', '심천지사', 'D+9', 'D+9', 0, '번역 API', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('35', '24', '운송 최적화 추천 (선사 스케줄/운임 비교)', 'FREIGHT_SCHEDULE', 'AI_AGENT', 'LOW', 'PENDING', 'PHASE_2B', '서울영업', 'D+9', 'D+9', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('36', '23', 'ELSA 실적 기반 3개월 물동량 단절 파트너 정보 전달', 'SALES_SUPPORT', 'API', 'LOW', 'PENDING', 'PHASE_2B', '서울영업', 'D+9', 'D+9', 0, 'ELSA 연동', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('37', '45', '진행 건 트랙킹 시스템', 'TRACKING_ALERT', 'SYSTEM_DEV', 'MEDIUM', 'PENDING', 'PHASE_2B', '공통의제', 'D+10', 'D+10', 0, '전사 공통 과제', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('38', '61', '선적 마감일/통관 기한/서류 제출 등 업무 마감 자동 알림', 'TRACKING_ALERT', 'RPA', 'MEDIUM', 'PENDING', 'PHASE_2B', '심천지사', 'D+10', 'D+10', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('39', '9', '오늘 해야 할 일 조회 기능', 'AI_CAPABILITY', 'SYSTEM_DEV', 'MEDIUM', 'PENDING', 'PHASE_2B', '경영지원', 'D+10', 'D+10', 0, '38번과 유사', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('40', '25', '디머러지/디텐션 위험 사전 감지', 'TRACKING_ALERT', 'RPA_API', 'LOW', 'PENDING', 'PHASE_2B', '서울영업', 'D+10', 'D+10', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('41', '53', 'HS CODE/화물가치 기준 관세사/보험사 메일 자동 발송', 'CUSTOMS_HSCODE', 'AI_AGENT', 'LOW', 'PENDING', 'PHASE_2B', 'JNB서울', 'D+10', 'D+10', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('42', '6', 'PDF/Excel(CIPL) 기반 B/L 자동 입력', 'SYSTEM_INTEG', 'RPA_AI', 'LOW', 'PENDING', 'PHASE_2B', '경영지원', 'D+10', 'D+10', 0, 'OCR', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('43', '26', '거래 없는 지점 파트너사 정보 주기적 영업사원 전달', 'SALES_SUPPORT', 'API', 'LOW', 'PENDING', 'PHASE_3', '서울영업', 'D+11', 'D+11', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('44', '42', '모선 딜레이 및 예상 출항일정 분석', 'FREIGHT_SCHEDULE', 'AI_RAG_API', 'LOW', 'PENDING', 'PHASE_3', '서울전략', 'D+11', 'D+11', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('45', '55', '메일 빅데이터 학습으로 HS CODE/DG 자동 판단', 'CUSTOMS_HSCODE', 'AI_RAG', 'LOW', 'PENDING', 'PHASE_3', '심천지사', 'D+11', 'D+11', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('46', '8', '시스템에 운임 자동 입력', 'FREIGHT_SCHEDULE', 'API', 'LOW', 'PENDING', 'PHASE_3', '경영지원', 'D+11', 'D+11', 0, 'ELSA 연동', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('47', '13', '미수 발생 시 안내문 자동 발송', 'SYSTEM_INTEG', 'RPA_API', 'LOW', 'PENDING', 'PHASE_3', '경영지원', 'D+11', 'D+11', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('48', '34', '실시간 다국어 번역', 'TRANSLATION', 'COMMERCIAL', 'LOW', 'PENDING', 'PHASE_3', '서울영업', 'D+11', 'D+11', 0, 'DeepL/Google API', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('49', '47', '각 진행 건 업무 프로세스 트랙킹', 'TRACKING_ALERT', 'SYSTEM_DEV', 'LOW', 'PENDING', 'PHASE_3', '공통의제', 'D+11', 'D+12', 0, NULL, 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('50', '5', '고객사가 이용할  데이터 Portal 구축', 'SYSTEM_INTEG', 'SYSTEM_DEV', 'LOW', 'PENDING', 'PHASE_3', '경영지원', 'D+11', 'D+12', 0, '중장기 대규모', 'Y') ON CONFLICT (task_code) DO NOTHING;
INSERT INTO dev_task (task_code, original_no, task_name, task_group, dev_type, priority, status, phase, proposer, planned_start, planned_end, progress, remarks, use_yn) VALUES ('51', '35', '메신저 통합 + 실시간 번역', 'TRANSLATION', 'SYSTEM_DEV', 'LOW', 'PENDING', 'PHASE_3', '서울영업', 'D+12', 'D+12', 0, '현실적으로 곤란', 'Y') ON CONFLICT (task_code) DO NOTHING;
