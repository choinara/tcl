# PeakMate 프로젝트 컨텍스트

> 이 파일은 **사실 기록(컨텍스트)**이다. 결정사항, 주의사항, 현재 상태만 남긴다.
> 행동규칙/바이브코딩 룰 → 글로벌 `~/.claude/CLAUDE.md`
> 하네스 설정/스킬 목록 → `.claude/CLAUDE.md`
> 세션 이력 → `myclaudemd/CLAUDE.md`

## 결정사항 (앞으로 바꾸지 말 것)

### 아키텍처
- **백엔드**: Spring Boot 3.5.7 + JPA + Java 21, 4-layer (interfaces/application/domain/infra)
- **백엔드 공유 라이브러리**: `peakmate-core-be/` (com.peakmate.core.*) — AuditableEntity, ApiResponse, @RequirePermission, @PiiExportGuard, @ConfigurationProperties 설정
- **@RequirePermission menus[] OR 조건**: `menus={"AA0030","AA0031"}` 형태로 복수 메뉴코드 지원 (2026-06-06~). 단일 메뉴는 기존 `menu="AA0030"` 그대로 사용 가능 (하위 호환)
- **프론트엔드**: React 19 + Vite + TypeScript + Zustand + TanStack Query
- **공통 컴포넌트**: `peakmate-core` 패키지 (grid, layout, ui, auth, error)
- **그리드**: `PeakDataGrid`(읽기전용, queryUrl 필수, data prop 없음) / `PeakEditGrid`(편집, data+permission prop 필수) 이원화
- **PeakDataGrid 1시간 캐시**: 모듈 레벨 Map 캐시(TTL 1h) 내장. 페이지 재진입 시 캐시 우선 → 조회 버튼 클릭 시 서버 재조회 + 캐시 갱신. `PeakEditGrid` 페이지는 신규 개발/리팩토링 시 동일 패턴 적용
- **공통 라이브러리 변경**: peakmate-core, peakmate-core-be 수정 전 "수정 대상/현재 동작/변경 내용/영향 범위/사유" 보고 후 승인

### AAS/OPC-UA 하드웨어 아키텍처
- PLC 수집: Modbus/TCP → Modbus-to-OPC-UA 브릿지(Option 3, 엣지 서버 내) → 수집 서비스(OPC-UA Client)
- Vision 수집: SMB 공유 폴더 감시(단기) → HTTP POST(장기, INSP_PIN_LTK.exe 수정)
- 엣지(Linux+Docker) → 통합관제센터: **Push 방식 HTTPS REST API** (`POST /api/opcua/ingest`)
- 엣지 내부 버퍼: 로컬 SQLite (서버 2 다운 시 임시 보관, 복구 후 재전송)
- Redis + TimescaleDB: 서버 2(통합관제센터) 배치, TimescaleDB는 PostgreSQL Extension
- 상세: `docs/20_peakmate_docs/23_도메인/AAS/AAS_하드웨어_아키텍처.md` (v1.1, 2026-05-30)
- 시각 보고서: `docs/99_html/AAS_OPC-UA_ASIS_TOBE_분析서.html`

### AAS/OPC-UA Phase 2 — BQueue 수집 파라미터 (2026-05-31 방향 확정, 현업 협의 후 최종 확정)
- PLC: 6F 24대 + 4F 28대 = 52대. 레지스터: 700개/대
- **수집 Tier 분리**: T1 실시간 200개(0.1초 수집→Redis/1초 TSDB) / T2 비실시간 200개(1초) / T3 비필수 300개(10초)
- **BQueue**: `LinkedBlockingQueue` 200,000건 (JVM 힙 인메모리 임시 버퍼)
- **flush drainTo**: 70,000건 / **flush 주기**: 5초 (fixedDelay, @Async 제거)
- **@Async 제거 근거**: fixedDelay + @Async 조합 시 동시 실행 위험 → fixedDelay 단독으로 순차 보장
- **TaskScheduler poolSize**: 8 (기존 5개 + Phase2 추가 1개 + 여유 2개)
- **MailRetryableSender**: @Retryable 주석 처리 (메일 서비스 설계 완성 후 복원)
- 부하 계산기: `docs/OpcUA_BQueue_부하계산기.xlsx`
- 시퀀스 다이어그램 v2: `docs/99_html/PLC_엣지서버_시퀀스_v2.html`

### 엔티티 패턴
- 모든 엔티티: `extends AuditableEntity` 필수. `createdAt`/`updatedAt` 직접 선언 금지, `LocalDateTime.now()` 수동 호출 금지
- 팩토리 메서드 `create()`/`update()` 패턴 유지 (생성자 직접 호출 금지)

### 네이밍 규칙
- 백엔드 패키지: `com.peakmate.backend.{layer}.{domain}`
- 프론트 도메인: `frontend/src/domains/{domain}/{feature}/ui/{Page}.tsx`
- 메뉴코드: 대문자 약어 + 4자리 숫자 (SM0010, WH0010 등). 상태코드: 한글 문자열 (`'가입고'`, `'승인완료'`)
- JWT 토큰 용어: **refreshToken** 통일 (pollingToken 금지)
- **AAS 도메인 API 응답 인터페이스: snake_case 공식 채택** — AAS Controller 응답 record 및 프론트엔드 `shared/types/index.ts` 인터페이스는 snake_case 사용. 단, UI 로컬 상태(그리드 행 데이터, 모달 Props 등)는 camelCase 유지. 타 도메인(SM/WH/ET 등)은 camelCase 표준 그대로 적용.

### API 패턴
- 응답 래핑: `ApiResponse<T>`. 인증: JWT HttpOnly 쿠키 + `@RequirePermission`. 일괄 저장: `POST /batch`

### JWT / 인증 보안
- RS256 (JJWT 0.12.6), `keys/jwt-private.pem`(서명) / `keys/jwt-public.pem`(검증)
- Access Token: 30분 + jti UUID (세션 DB 저장). Refresh Token: 1시간. 절대 타임아웃: 8시간
- 저장: HttpOnly 쿠키만 (localStorage 금지). Claims: roles만 (개인정보 미포함)
- 갱신: 만료 5분 전. 비밀번호 변경 시 전체 세션 무효화. 프론트 타이머: 15분마다 체크

### 계정 보안 (GS인증 + PIPA)
- 잠금: 5회 실패→30분. 비밀번호: 90일 만료, 최근 3개 재사용 방지, 12자리+ 복잡도
- PII: AES-256-GCM 5필드 암호화(`EncryptedStringConverter`), 목록 항상 PARTIAL, 개별 열람 `GET /api/system/users/{id}/pii`
- RBAC 7종: canRead/Create/Update/Delete/Export/ViewPii/Approve. 승인 API는 `action="approve"`
- 스케줄러: 02시 휴면비활성화(90일), 03시 로그파기+익명화(365일), 04시 세션정리

### 다국어(i18n)
- 7개 언어(ko/en/ja/zh/vi/id/th), 정적 JSON + DB 오버라이드 2단계 구조
- 신규 페이지: `useTranslation()` + `t()` 필수. 번역 키: `page.{도메인}.{요소}`, `common.{액션}`, `message.{타입}`

### 프론트엔드 UI
- 페이지: `<PageTitle>` 필수. 버튼: `mes-btn` / `mes-btn-save` / `mes-btn-delete`. 모달: peakmate-core `<Modal>`
- 그리드 헤더 CSS: `ag-header-required`(적*) / `ag-header-auto`(파*) / `ag-header-required-auto`(**)
- 그리드: 정렬 `sort_order ASC, id ASC`. 드롭다운 `agSelectCellEditor` 우선 (code_name 표시, code 저장)
- 권한: PeakEditGrid `permission={perm}` 필수. PeakDataGrid `permission={{ canExport: perm.canExport }}` 전달

### 탭 세션 / 그리드 레이아웃 템플릿
- 탭: `user_open_tab` DB 영구 저장. 로그인 시 복원, 0개일 때 첫 권한 메뉴 자동 진입
- 레이아웃 템플릿: L1-A(인라인편집) / L1-B(팝업편집) / L2(마스터-디테일). 스켈레톤: `frontend/src/templates/`
- 그리드 카탈로그: T01(기준정보12) / T02(목록+모달8) / T03(매트릭스3) / T04(마스터-디테일2)

### SearchCriteria / MonthlySearchBar
- `SearchCriteria`: border 없음(박스 없는 디자인). `hideSearch=true` 시 조회 버튼 숨김
- `MonthlySearchBar`: 기간 버튼 클릭=즉시 조회 시 `hideSearch` 적용. 행 선택은 `PeakEditGrid.onRowClick` prop 사용

### 도메인 관계 — Partner / Supplier / Customer
- 3개 엔티티는 **독립 엔티티** (FK 없음). MasterSupplier는 MasterPartner로 통합(메뉴 비활성화)
- 가입고/원자재 supplierCode/supplierName 필드 유지, 실제 참조 대상은 partner

### 신규 메뉴 등록 프로세스
- 5개 필수: ① `system_menu` INSERT (`use_yn='Y'`) ② `App.tsx` Route+pathToMenuCode ③ `menuConfig.ts` 폴백 ④ `@RequirePermission` ⑤ `usePermission()`
- DB 변경 후 **로그아웃 → 재로그인** 필요. 구현 후 `/menu-verify {코드}` 8개 항목 검증

### Neon Cloud DB (개발용)
- Host: `ep-twilight-forest-aoa9sy53.c-2.ap-southeast-1.aws.neon.tech`, DB: `peakmate`, 접속: `backend/.env.neon`, 프로파일: `neon`

### DB 마이그레이션
- 도구: Flyway, `out-of-order: true`. 신규: 타임스탬프 `V{YYYYMMDDHHMMSS}__xxx.sql` 권장 (정수 V75+ 허용)
- 정수 사용 시 크로스체크: `MAX(DB버전, 로컬버전)+1`. pre-commit hook: 수정/중복/갭 차단
- FK 없이 논리 참조. 캐시 필드: `code`(참조)+`name`(캐시) 병행

### 설계서 저장 경로
- 자체 산출물: `/Users/hschoi/Documents/Git/CHS/docs/20_peakmate_docs/` (21_프로젝트/22_공통기능/23_도메인/29_템플릿)
- 참고 자산: `/Users/hschoi/Documents/Git/CHS/docs/12_dogeum_docs/설계서_실행계획_업무 도메인/`
- HTML 보고서: `/Users/hschoi/Documents/Git/CHS/docs/99_html/`. 화면 이미지 제공 시 `화면설계_체크리스트.md` 10단계 적용

## 다음 할 일

> `myclaudemd/CLAUDE.md` 에서 관리 — `/session-save` 저장, `/session-load` 복기

## 현재 파일 구조 중 중요한 것

> 상세 경로 지도: `docs/claude/파일구조.md` 참조 (백엔드/프론트엔드/peakmate-core/DB 마이그레이션 이력)

## 주의사항 (건드리면 안 되는 것)

### 환경 설정
- `frontend/.env`: `VITE_API_URL=http://localhost:5181` — 변경 금지
- 포트: 백엔드 9096, 프론트 6182, DB 55432
- 백엔드 `application.yml` 프로파일: local/dev/prod 분리 유지

### 의존성
- AG Grid 35.1.0 — 라이선스 버전, 업그레이드 시 호환성 확인 필수
- React 19.2.0, Java 21 (Zulu) — 다운그레이드 금지
- `html5-qrcode` — 바코드 스캔용, 제거 금지

### 공통 컴포넌트 패턴
- **`@peakmate/core` 배럴 import 금지** — Vite pre-bundle `export *` + default 충돌(SyntaxError). 개별 path alias 사용: `@/components/ui/X`, `@/hooks/X`, `@/lib/X`
- `PeakDataGrid` / `PeakEditGrid` 내부 구조 임의 변경 금지 (전체 페이지 영향)
- `authFetch` 인증 흐름: HttpOnly 쿠키 + `credentials: 'include'` — localStorage 금지
- **shadcn/ui**: 컴포넌트는 `frontend/src/components/shadcn/`에 직접 작성. `@/components/ui`는 peakmate-core 전용
- **PremiumCard**: glassmorphism 전용 (`neo-glass` 클래스 하드코딩) — 일반 배경에 적용 금지

### 커밋/보안 제약
- 실행계획서/리서치 산출물(`docs/20_peakmate_docs/`)은 Git 커밋 제외
- localStorage에 토큰 저장 금지. JWT Claims에 개인정보 포함 금지
- `CommonCodeUsageChecker.USAGE_MAP`은 소스코드 상수만 (외부 입력 금지)
- pre-commit hook(`--no-verify`) 우회 금지. 커밋된 마이그레이션 파일 수정 금지
- 메모리 저장, 문서 수정, 결정사항 반영 등은 컨펌 없이 진행 금지
- 모든 경로는 절대경로로만 표시

### feature/e-contract-wip 브랜치
- V35~V38, V40 마이그레이션이 이 브랜치에만 존재 (main 병합 전 충돌/빌드 확인 필수)
