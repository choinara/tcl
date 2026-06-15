# PeakMate 프로젝트 컨텍스트

## 현재 작업 (2026-04-01~05 세션)

### 이번 세션에서 수정/생성한 파일

| 카테고리 | 파일 | 변경 내용 |
|----------|------|----------|
| **체크박스 행선택** | `PeakEditGrid.tsx` | `showCheckbox` prop 추가, 체크박스 컬럼(40px, 좌측 고정) |
| | `PreInboundPage.tsx` | `showCheckbox={true}` 적용 |
| | `agGridTheme.css` | 체크박스 컬럼 중앙정렬 CSS |
| | `ColumnSelector.tsx` | 8열 확장, 버튼 기준 위치 고정, 대량 컬럼 스크롤 |
| **승인취소** | `WhPreInbound.java` | `cancelApproval()` 메서드 추가 |
| | `WhPreInboundController.java` | `POST /cancel-approve` 엔드포인트 |
| | `PreInboundPage.tsx` | "승인취소" 버튼 + 핸들러 |
| **JPA Auditing** | `AuditableEntity.java` | `@CreatedDate`/`@LastModifiedDate` 공통 슈퍼클래스 (신규) |
| | `AuditingConfig.java` | `@EnableJpaAuditing` + `AuditorAware` 빈 (신규) |
| | 56개 엔티티 전체 | `extends AuditableEntity` 적용, 수동 timestamp 제거 |
| **Java 21** | `backend/build.gradle` | `JavaLanguageVersion.of(17)` → `of(21)` |
| | `e-approval/build.gradle` | 동일 변경 |
| **에러 처리 보완** | 22개 프론트 페이지 | `catch{/*ignore*/}` 38건→`notify()`, `console.error` 16건→`notify()` 병행, `alert()` 9건→`notify()` |
| | `ToastProvider.tsx` | 토스트 5초, 에러이력 메시지보기 (그리드 하단 바 고정 텍스트) |
| | `AnthropicOcrExtractor.java` | RuntimeException 메시지 정제 (내부 정보 노출 차단) |
| **시스템 로그 확장** | `AuthController.java` | LOGIN_FAIL, ACCOUNT_LOCK, PASSWORD_CHANGE 로그 추가 |
| | 11개 마스터 컨트롤러 | MASTER_CREATE 로그 추가 |
| | `WhPreInboundController.java` | APPROVAL, APPROVAL_CANCEL, DATA_IMPORT 로그 |
| | `GlobalExceptionHandler.java` | ERROR 로그 추가 |
| | `SystemSettingController.java` | SETTING_CHANGE 로그 |
| | `SystemMenuController.java` | MENU_CHANGE 로그 + 메뉴 생성 시 SUPER_ADMIN/ADMIN 자동 권한 부여 |
| | `SystemLogController.java` | logType 필터 + keyword 파라미터 지원 |
| | `logFilterDefaults.ts` | 22개 logType 필터 |
| **MasterPartner** | `MasterPartner.java` | 협력사 엔티티 (신규) |
| | `MasterPartnerController.java` | CRUD + /all API (신규) |
| | `V52__master_partner_table.sql` | 테이블 + 메뉴(MM0120) + 권한 |
| | `PartnerPage.tsx` | 협력사관리 프론트 페이지 (신규) |
| | `SecurityConfig.java` | `/api/master/partners/all` permitAll |
| **Supplier→Partner 통합** | `V55__merge_supplier_to_partner.sql` | supplier 데이터를 partner로 이관, MM0020 메뉴 비활성화 |
| | `PreInboundPage.tsx` | supplier 검색 → partner 검색으로 전환 |
| | `App.tsx`, `menuConfig.ts` | supplier 라우트/메뉴 제거 |
| **공통코드 강화** | `CommonCodeUsageChecker.java` | 삭제 시 사용 이력 검증 서비스 (신규) |
| | `CommonCodeController.java` | batch/단건 삭제에 사용 이력 검증 추가 |
| | `CommonCodePage.tsx` | useYn 컬럼 우측 추가, 전체보기 체크박스 |
| | `V53__master_code_unique_constraints.sql` | 고객/제품/설비 코드 유니크 제약 |
| | `V54__partner_common_codes.sql` | PARTNER_TYPE(5종), TRANSACTION_STATUS(3종) 시드 |
| | `PartnerPage.tsx` | 하드코딩 → `useCommonCodes` 훅 연동 |
| | 6개 마스터 컨트롤러 | batch 저장 시 코드 중복검증 추가 |
| | 5개 마스터 리포지토리 | `findByXxxCode()` / 복합 findBy 메서드 추가 |
| **기준정보 isActive 통일** | 12개 마스터 컨트롤러 | toMap() isActive boolean→문자열 변환 제거 |
| | 12개 마스터 페이지 | isActive 셀렉트박스(Y/N) + 미사용 제외/포함 버튼 토글 |
| **JWT 보안 강화 6단계** | `application.yml` | access 30분, refresh 1시간 |
| | `JwtTokenProvider.java` | REISSUE_THRESHOLD 5분, TYPE_POLLING→TYPE_REFRESH |
| | `api.ts` | localStorage 폐기, `credentials: 'include'`, 타이머 15분 |
| | `useAuthStore.ts` | localStorage 18곳 제거, 쿠키 기반 전환 |
| | `useApi.ts`, `AppLayout.tsx` | localStorage 제거, credentials include |
| | `LoginPage.tsx` | 토큰 저장 제거, login(user) 단일 인수 |
| | `AdminUserSession.java` | session_started_at 필드 추가 |
| | `AdminUserSessionDomainService.java` | 절대 타임아웃 8시간 + 토큰 SHA-256 해시 저장 |
| | `TokenHashUtil.java` | SHA-256 해시 유틸리티 (신규) |
| | `AuthDomainService.java` | JWT Claims에서 name 제거 |
| | `AuthController.java` | 쿠키 Max-Age 조정, 갱신 실패 시 쿠키 클리어, 쿠키 읽기 순서 변경 |
| | `SecurityConfig.java` | exposedHeaders에 X-Token-Expiring 추가 |
| | `V56__session_started_at.sql` | session_started_at 컬럼 |
| | `V57__session_token_hash_truncate.sql` | 세션 초기화 (해시 전환) |
| | 백엔드 11파일 | pollingToken → refreshToken 리네이밍 |
| **JWT 동작테스트 버그수정** | `AppLayout.tsx` | 프로필 수정 Authorization 헤더 제거 → credentials include |
| | `AppLayout.tsx` | `.catch(() => null)` → 에러 메시지 포함 (Rule 8-2) |
| | `NotificationBanner.tsx` | localStorage.accessToken 제거 → useAuthStore user 체크 |
| | `AuthController.java` | 비밀번호 변경 후 deleteAllSessions() 세션 무효화 추가 |
| **coreNotify 인프라 + alert 제거** | `useNotifyStore.ts` | Zustand 알림 스토어 + coreNotify() 헬퍼 (신규) |
| | `index.ts` | barrel export 추가 |
| | `App.tsx` | NotifyStoreInitializer 초기화 컴포넌트 추가 |
| | `LoginPage.tsx` | bulletin fetch credentials: 'include' 추가 (CRITICAL) |
| | `PeakDataGrid.tsx` | alert→coreNotify (소계 삽입) |
| | `PeakEditGrid.tsx` | alert→coreNotify (행부족, 열부족, 소계 삽입) |
| | `AppLayout.tsx` | alert→coreNotify (강제 로그아웃 persistent) + TODO 해소 |

## 결정사항 (앞으로 바꾸지 말 것)

### 아키텍처
- **백엔드**: Spring Boot 3.5.7 + JPA + Java 21, 4-layer (interfaces/application/domain/infra)
- **백엔드 공유 라이브러리**: `peakmate-core-be/` (Gradle java-library, com.peakmate.core.* 패키지)
  - 공통 인프라: AuditableEntity, ApiResponse, ErrorCodeProvider/CommonErrorCode, BaseExceptionHandler, CookieUtil, AES256Encryptor
  - 설정: JwtProperties, SecurityProperties (@ConfigurationProperties)
  - 캐시: CacheAutoConfiguration (Caffeine, @ConditionalOnMissingBean — Redis 전환 가능)
  - 재시도: RetryAutoConfiguration (@EnableRetry)
  - 모니터링: MailHealthIndicator
  - 어노테이션: @RequirePermission, @PiiExportGuard
- **프론트엔드**: React 19 + Vite + TypeScript + Zustand + TanStack Query
- **공통 컴포넌트**: `peakmate-core` 패키지로 분리 (grid, layout, ui, auth, error)
- **그리드**: AG Grid 35 기반 `PeakDataGrid`(읽기전용) / `PeakEditGrid`(편집) 이원화

### 엔티티 패턴
- 모든 엔티티는 `extends AuditableEntity` 필수 (`global/entity/AuditableEntity.java`)
- `createdAt`/`updatedAt`은 JPA Auditing이 자동 관리 — 엔티티에 직접 선언 금지, `LocalDateTime.now()` 수동 호출 금지
- `AuditorAware`가 SecurityContext에서 username을 자동 추출 (`AuditingConfig.java`)
- 팩토리 메서드 `create()`/`update()` 패턴 유지 (생성자 직접 호출 금지), timestamp 설정 코드 불필요

### 네이밍 규칙
- 백엔드 패키지: `com.peakmate.backend.{layer}.{domain}`
- 프론트 도메인: `frontend/src/domains/{domain}/{feature}/ui/{Page}.tsx`
- 메뉴코드: 대문자 약어 + 4자리 숫자 (SM0010, WH0010, MM0120 등)
- DB 마이그레이션: `V{번호}__{설명}.sql` (Flyway)
- 상태코드: 한글 문자열 사용 (`'가입고'`, `'승인완료'`, `'미승인'` 등)
- JWT 토큰 용어: **refreshToken** 통일 (pollingToken 사용 금지)

### API 패턴
- 응답 래핑: `ApiResponse<T>` (success/error 통일)
- 인증: JWT (HttpOnly 쿠키) + `credentials: 'include'` (프론트), `@RequirePermission` (백엔드)
- 일괄 저장: `POST /batch` (created/updated/deleted 배열)
- 목록 조회: `GET /api/{domain}/{resource}` (쿼리파라미터 필터)

### JWT / 인증 보안
- **서명 알고리즘: RS256** (비대칭키, JJWT 0.12.6) — HS512에서 전환 완료
- **키 관리**: `file:./keys/jwt-private.pem` (서명), `file:./keys/jwt-public.pem` (검증). .gitignore에 `**/keys/*.pem` 등록
- **jti(JWT ID)**: Access Token에만 UUID 부여. 세션 DB에 jti로 저장 (해시 불필요). Refresh Token에는 jti 미부여 — 세션 관리는 Access Token jti로만 수행
- Access Token 유효기간: **30분**, Refresh Token: **1시간**
- 갱신 임계값: **만료 5분 전** (`REISSUE_THRESHOLD`)
- 토큰 저장: **HttpOnly 쿠키만** (localStorage 사용 금지)
- 세션 DB: **jti VARCHAR(36) UNIQUE INDEX** (기존 access_token 해시 방식에서 전환)
- 절대 타임아웃: **8시간** (session_started_at 기준, 갱신 시 검증)
- JWT Claims: roles만 포함 (**name 등 개인정보 미포함**, `/api/auth/me`에서 조회)
- 쿠키 Max-Age: Access 35분, Refresh 1시간
- 비밀번호 변경 시: **전체 세션 무효화** (deleteAllSessions → 재로그인 필요)
- 쿠키 보안: HttpOnly, Secure(prod), SameSite=Strict
- CORS: `allowCredentials(true)`, exposedHeaders에 `X-Token-Expiring` 포함
- 프론트 세션 타임아웃: 30분 무활동 시 경고 → 5분 후 강제 로그아웃 (`SessionTimeoutProvider`)
- 프론트 타이머: 15분마다 체크, 25분 이내 활동이 있으면 자동 갱신

### 에러 처리
- 중복: 409 Conflict
- 유효성: 400 Bad Request
- 권한: 403 Forbidden
- GS인증 기준 필수 적용 (SQL Injection/XSS 방어, 입력값 검증, 권한 체크)
- 프론트엔드: `catch { /* ignore */ }` 금지 → `notify('...', { type: 'error' })` 필수
- 프론트엔드: `console.error`만 금지 → `notify()` 병행 필수
- 프론트엔드: `alert()` 금지 → `notify()` 토스트 통일
- 프론트엔드: JSON 파싱 fallback → `.catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }))`
- 백엔드: 예외 메시지에 내부 API 상세(URL, 상태코드, 스택트레이스) 노출 금지
- **바이브코딩 6단계 프로토콜 적용** (5단계→6단계 확장): 구현 후 테스트 필수. 상세: `docs/20_peakmate_docs/21_프로젝트/213_테스트/테스트_단계_가이드라인.md`

### 시스템 로그 규칙
- 인증(로그인 실패, 계정 잠금, 비밀번호 변경, 강제 로그아웃) → SystemLog 필수
- 사용자/권한 변경(생성, 수정, 삭제, 역할/권한 변경) → SystemLog 필수
- 업무 처리(승인, 승인취소, 일괄저장) → SystemLog 필수
- 기준정보 batch 완료 시 건수 포함 → SystemLog 필수
- 시스템 설정/메뉴 변경 → SystemLog 필수
- API 500 에러 + 스케줄러 실패 → SystemLog 필수
- 패턴: `try { systemLogService.log(...); } catch { log.warn(...); }` (비즈니스 로직 무영향)
- 신규 메뉴 생성 시 SUPER_ADMIN/ADMIN 자동 권한 부여 (`grantDefaultPermissions`)

### 기준정보 코드 관리
- 코드 필드가 있는 엔티티는 DB UNIQUE 인덱스 필수 (단일 또는 복합)
- batch 저장 `case "created"` 블록에서 `findByXxxCode()` 중복 체크 필수
- 복합 유니크: `findByField1AndField2()` 복합 검증 적용
- 프론트 코드 필드: 신규행에서만 편집 가능 `editable: (p) => !p.data?.id`
- isActive 컬럼: 셀렉트박스 `['Y', 'N']` + 미사용 회색 + "미사용 제외/포함" 버튼 토글

### 드롭다운/공통코드 관리
- 드롭다운 선택값은 하드코딩 금지 → 공통코드 테이블에서 관리 (`useCommonCodes` 훅)
- 공통코드 삭제 시 사용 이력 확인 필수 (사용 중이면 useYn='N'으로 전환)
- 신규 공통코드 그룹 참조 시 `CommonCodeUsageChecker.USAGE_MAP`에 매핑 등록 (소스코드 상수만)

### peakmate-core 알림 패턴
- peakmate-core 내부에서 사용자 알림이 필요할 때: `coreNotify(message, options)` 사용 (`useNotifyStore.ts`)
- `alert()` 사용 금지 — `coreNotify()`로 대체
- frontend App.tsx의 `NotifyStoreInitializer`가 ToastProvider의 `notify()`, `errorHistory`, `setErrorPanelOpen`을 스토어에 등록
- 초기화 전 호출 시 `console.warn` fallback으로 메시지 누락 방지
- **peakmate-core에서 `@/shared/` import 금지** — frontend 의존성 역전 방지. Zustand 브릿지 패턴 사용

### 다국어(i18n)
- 7개 언어: ko(기본), en, ja, zh, vi, id, th
- 정적 JSON + DB 오버라이드 2단계 구조
- 로그인 페이지: 정적 JSON만 사용 / 로그인 후: `loadI18nOverrides()`로 DB 번역 적용
- `LanguageSwitcher`: AppLayout 헤더 우측 (사용자명과 로그아웃 사이)
- 신규 페이지: `useTranslation()` + `t()` 필수 / 기존 55+페이지: 하드코딩 유지 (향후 일괄 전환)
- 번역 키 네이밍: `page.{도메인}.{요소}`, `common.{액션}`, `message.{타입}`

### 프론트엔드 UI
- 그리드 툴바: 좌측 기능버튼 + 우측 저장/엑셀 버튼 (flexWrap: wrap 필수)
- 페이지 타이틀: `<PageTitle>` 컴포넌트 사용 (개발메모 ! 아이콘 포함)
- 모달: `peakmate-core`의 `<Modal>` 컴포넌트 사용
- 버튼 스타일: `mes-btn`, `mes-btn-save`, `mes-btn-delete` 클래스
- 에러 이력: 그리드 하단 바 "메시지보기 (N)" 텍스트 → 클릭 시 에러 이력 팝업

### 도메인 관계 — Partner / Supplier / Customer
- 3개 엔티티는 **독립 엔티티** (FK 없음, 상위 통합 아님)
- MasterCustomer: 우리 제품을 구매하는 고객사 (수주, 품질기준, 제품마스터)
- MasterSupplier: 원재료를 공급하는 업체 — **협력사관리(MasterPartner)로 통합됨**, 메뉴 비활성화
- MasterPartner: 시스템 접근이 필요한 외부 기업 (사용자관리 소속거래처, 비즈니스 로직)
- 가입고/원자재의 supplierCode/supplierName 필드는 유지하되 실제 참조 대상은 partner

### 작업 범위 준수 규칙
- 실행계획서에 명시된 작업만 수행
- 계획에 없는 파일 수정/신규 생성/문제 수정은 보고 후 승인받고 진행
- 보고 형식: "[파일명]에서 [문제]를 발견했습니다. [수정방향] — 수정할까요?"

### 실행계획서 규칙
- 코딩 규칙·패턴·컨벤션 변경 포함 시 **바이브코딩 4개 문서 세트 업데이트** 필수
- 4개 문서: `CLAUDE.md`, `.claude/CLAUDE.md`, `docs/peakmate 바이브코딩 개론.md`, `docs/필독_바이브코딩_조사_계획_주석_실행.md`

### DB 마이그레이션
- 도구: Flyway
- pre-commit hook으로 기존 파일 수정 차단 + 버전 중복 차단 + 갭 경고
- FK 제약 없이 논리적 참조 (마스터 변경 시 이력 보존)
- 캐시 필드 패턴: `material_code`(참조) + `material_name`(캐시) 병행

## 완료된 작업 (날짜 포함 누적)

- 2026-04-07: 글래스모피즘 CSS 체계 정립 (CSS 변수 16개, 하드코딩 전환, glassUtils.ts 중복 함수 통합, 프리셋 2종 추가)
- 2026-04-06: 다국어(i18n) 7개 언어 지원 (OrbitMES 번역 복사, LanguageDetector, LanguageSwitcher, DB 오버라이드, 키 누락 검증 테스트)
- 2026-04-05: peakmate-core-be C그룹 (@SystemLog AOP 15건, JPA Auditing createdBy/updatedBy V59, TokenProvider/JwtTokenProvider core-be 이동, PasswordEncoder 추출)
- 2026-04-05: peakmate-core-be 모듈 신설 + Spring Boot 인프라 확대 (ErrorCode 분리, @ConfigurationProperties, Actuator, HealthIndicator, @Cacheable, @Retryable, Scheduler)
- 2026-04-05: RS256 전환 + jti 도입 (HS512→RS256, JJWT 0.12.6, jti UUID 세션 관리, TokenHashUtil 미사용)
- 2026-04-05: peakmate-core 아키텍처 정리 (useToast→useNotifyStore 전환, @/shared import 제거)
- 2026-04-05: 코드 주석 "무시" 표현 개선 47건 (19파일, 폴백 전략 명시)
- 2026-04-05: coreNotify 인프라 구축 + alert 5건 제거 + LoginPage credentials 수정 + TODO 해소
- 2026-04-05: JWT 동작테스트 버그수정 4건 (AppLayout 프로필수정 401 버그, NotificationBanner localStorage 잔존, JSON 파싱 에러처리, 비밀번호변경 세션무효화)
- 2026-04-05: JWT 보안 강화 6단계 (30분 토큰, HttpOnly 쿠키 전용, 절대 타임아웃 8시간, 토큰 해시 저장, Claims 최소화, refreshToken 리네이밍)
- 2026-04-04: 기준정보 12개 페이지 isActive 셀렉트박스(Y/N) 통일 + 미사용 제외/포함 버튼 토글
- 2026-04-04: 공통코드 사용여부/삭제검증, 협력사 공통코드 전환, supplier→partner 통합, 코드 중복검증, 메뉴 자동권한
- 2026-04-03: MasterPartner API 구현, 시스템 로그 필터 수정, 에러이력 UI 개선
- 2026-04-03: 에러 처리 보완 (38+16+9+20건), 토스트 에러이력 UI, 시스템 로그 25종 확장
- 2026-04-02: 전체 엔티티 AuditableEntity 적용 (55개), JPA Auditing 인프라 구축
- 2026-04-02: Java 17→21 업그레이드
- 2026-04-01: 가입고등록 체크박스 행선택, 승인취소 기능, ColumnSelector 개선
- 2026-04-01: 개발메모(!) 기능, 가입고 시드 10건, 상태변경 셀렉트박스 통합
- 2026-04-01: 가입고등록 전체 구현, 세션 보안 강화, 그리드 클립보드/소계 기능 추가
- 2026-03-29: 일별생산계획 백엔드/DB, 알림·게시판·시스템설정 개선, 하단소계 공통화
- 2026-03-25: 기준정보관리 11개 테이블 CRUD, 수주등록, GS인증 보안
- 2026-03-23: 메일 인프라, 비밀번호 초기화, SSE 강제 로그아웃, DB 세션 검증
- 2026-03-20: AAS/OPC-UA 백엔드 + 전자결재 공용모듈 통합, GS인증 테스트
- 2026-03-19: GS인증 기반 세팅, 생산계획등록, PeakDataGrid 전환

## 다음 할 일 (우선순위 순서)

- [x] JWT 보안 강화 동작 테스트 (로그인/갱신/로그아웃/새로고침 시나리오 검증) — 버그 4건 수정 완료
- [ ] 바코드 출력 모듈 구현 (채번은 완료, 출력/인쇄 미구현)
- [ ] 불량/보류/반품/폐기 실제 로직 구현 (현재 notify만)
- [ ] 승인 후 프로세스 설계 (승인완료 → 입고완료 → 생산투입 전이)
- [ ] 협력사관리 프론트 페이지 세부 기능 (검색, 필터 등)
- [ ] 미커밋 파일 정리 (document, excel, i18n, receipt, report, approval, utility 도메인)
- [ ] V35~V40 마이그레이션 파일 커밋
- [x] RS256 전환 + jti 도입 — 완료 (JJWT 0.12.6, V58 마이그레이션)
- [ ] 향후 보안 고도화: Redis jti 캐시, 세션 타임아웃 설정 DB화

## 현재 파일 구조 중 중요한 것

### 백엔드 핵심 경로
```
backend/src/main/java/com/peakmate/backend/
├── domain/
│   ├── warehouse/entity/WhPreInbound.java         # 가입고 엔티티
│   ├── master/entity/Master*.java                 # 기준정보 12개 엔티티 (Partner 포함)
│   ├── admin/entity/AdminUserSession.java         # 세션 (session_started_at, 해시 토큰)
│   ├── admin/service/AdminUserSessionDomainService.java  # 세션 관리 (해시, 절대 타임아웃)
│   ├── auth/service/AuthDomainService.java        # 인증 (토큰 생성, Claims)
│   ├── commoncode/service/CommonCodeUsageChecker.java  # 공통코드 사용 이력 검증
│   ├── log/service/SystemLogService.java          # 시스템 로그
│   └── system/entity/DevMemo.java                 # 개발메모
├── interfaces/
│   ├── auth/controller/AuthController.java        # 로그인/로그아웃/갱신/비밀번호변경
│   ├── warehouse/controller/WhPreInboundController.java  # 가입고 CRUD
│   ├── master/controller/Master*Controller.java   # 기준정보 12개 (중복검증 포함)
│   ├── system/controller/SystemMenuController.java # 메뉴 관리 (자동 권한 부여)
│   └── commoncode/controller/CommonCodeController.java   # 공통코드 (삭제 검증)
├── infra/
│   ├── security/jwt/JwtTokenProvider.java         # JWT 생성/검증 (30분, 5분 임계값)
│   ├── security/jwt/JwtAuthenticationFilter.java  # 필터 (세션 DB 검증, X-Token-Expiring)
│   ├── security/config/SecurityConfig.java        # CORS, permitAll, 보안 헤더
│   └── security/config/CookieUtil.java            # HttpOnly 쿠키 (refresh_token)
├── global/
│   ├── entity/AuditableEntity.java                # @CreatedDate/@LastModifiedDate 공통
│   ├── config/AuditingConfig.java                 # @EnableJpaAuditing + AuditorAware
│   ├── util/TokenHashUtil.java                    # SHA-256 토큰 해시
│   └── error/GlobalExceptionHandler.java          # 에러 핸들링 + ERROR 로그
└── application/
    └── auth/facade/AuthFacade.java                # 인증 퍼사드
```

### 프론트엔드 핵심 경로
```
frontend/src/
├── App.tsx                                         # 라우트 정의, pathToMenuCode
├── config/menuConfig.ts                            # 메뉴 구조
├── domains/
│   ├── login/LoginPage.tsx                         # 로그인 (credentials include, 토큰 저장 없음)
│   ├── warehouse/pre-inbound/ui/PreInboundPage.tsx # 가입고등록 (체크박스, partner 검색)
│   ├── master/*/ui/*Page.tsx                       # 기준정보 12개 (isActive Y/N, 미사용 토글)
│   ├── master/partner/ui/PartnerPage.tsx           # 협력사관리 (공통코드 연동)
│   ├── system/common-code/ui/CommonCodePage.tsx    # 공통코드 (useYn, 전체보기)
│   ├── system/logs/ui/SystemLogList.tsx            # 시스템 로그 (22개 필터)
│   └── production/*/ui/*Page.tsx                   # 생산관리
```

### 공통 컴포넌트 (peakmate-core)
```
peakmate-core/src/
├── components/
│   ├── grid/PeakDataGrid.tsx                       # 읽기전용 그리드 + 에러 메시지보기
│   ├── grid/PeakEditGrid.tsx                       # 편집 그리드 (showCheckbox, 에러 메시지보기)
│   ├── grid/ColumnSelector.tsx                     # 컬럼 표시/숨김 (8열, 스크롤)
│   ├── ui/PageTitle.tsx                            # 페이지 타이틀 + 개발메모(!)
│   ├── auth/SessionTimeoutProvider.tsx             # 30분 세션 타임아웃
│   └── layout/AppLayout.tsx                        # SSE 연결 (credentials include)
├── stores/useAuthStore.ts                          # 인증 상태 (localStorage 없음, 쿠키 기반)
├── hooks/useCommonCodes.ts                         # 공통코드 조회 훅
├── hooks/useApi.ts                                 # API 클라이언트 (credentials include)
├── lib/api.ts                                      # authFetch, 토큰 갱신 타이머 (15분)
└── shared/components/toast/ToastProvider.tsx        # 토스트 5초 + 에러 이력
```

### DB 마이그레이션 (V1~V57)
```
backend/src/main/resources/db/migration/
├── V1~V34   # 기본 테이블, 메뉴, 권한, 공통코드, 마스터 등
├── V35~V40  # (미커밋) 영수증OCR, 보고서, 엑셀변환, DMS, 다국어, 전자결재 강화
├── V41~V44  # 일별생산계획
├── V45~V50  # 마스터 코드필드, 가입고, 세션, 시드
├── V51      # AuditableEntity 누락 컬럼 추가
├── V52      # master_partner 테이블 + MM0120 메뉴 + 권한
├── V53      # 기준정보 코드 유니크 제약 (고객/제품/설비)
├── V54      # PARTNER_TYPE + TRANSACTION_STATUS 공통코드 시드
├── V55      # supplier→partner 데이터 이관, MM0020 비활성화
├── V56      # session_started_at 컬럼 (절대 타임아웃)
└── V57      # 세션 TRUNCATE (토큰 해시 전환)
```

## 주의사항 (건드리면 안 되는 것)

### 환경 설정
- `frontend/.env`: `VITE_API_URL=http://localhost:5181` — 로컬 개발용, 변경 금지
- `frontend/.env.dev`, `.env.prod`: 배포 환경별 설정, 임의 수정 금지
- 백엔드 `application.yml` 프로파일: local/dev/prod 분리 유지
- 포트: 백엔드 9096, 프론트 6182, DB 55432

### 의존성
- AG Grid 35.1.0 — 라이선스 버전, 업그레이드 시 호환성 확인 필수
- React 19.2.0 — 최신 버전, 다운그레이드 금지
- Java 21 (Zulu) — 17에서 업그레이드 완료, 다운그레이드 금지
- `html5-qrcode` — 바코드 스캔용, 제거 금지

### 커밋된 마이그레이션 파일
- V1~V57 중 이미 커밋된 파일은 절대 수정 금지 (pre-commit hook이 차단)
- 변경 필요 시 새 버전 파일로 ALTER TABLE 작성

### pre-commit hook
- `.git/hooks/pre-commit` — Flyway 마이그레이션 보호 (수정 차단 + 중복 차단 + 갭 경고)
- hook 우회(`--no-verify`) 금지

### 공통 컴포넌트 패턴
- `PeakDataGrid` / `PeakEditGrid` 내부 구조 임의 변경 금지 (전체 페이지에 영향)
- `PageTitle` 개발메모 기능 제거 금지 (팀 공유 목적)
- `authFetch` 인증 흐름: HttpOnly 쿠키 + `credentials: 'include'` — localStorage 사용 금지
- `useAuthStore`: accessToken/refreshToken 상태 없음, login(user) 단일 인수

### JWT / 인증 보안
- localStorage에 토큰 저장 금지 (XSS 방어)
- 세션 DB에 토큰 평문 저장 금지 (TokenHashUtil.hash() 필수)
- JWT Claims에 name 등 개인정보 포함 금지
- `CommonCodeUsageChecker.USAGE_MAP`은 소스코드 상수만 (외부 입력 금지, SQL Injection 방어)

### 미커밋 작업 (untracked)
- `backend/.../document/`, `excel/`, `i18n/`, `receipt/`, `report/` — 진행 중인 도메인, 삭제 금지
- `frontend/.../approval/lines/`, `approval/status/`, `document/`, `utility/` — 진행 중인 프론트 페이지, 삭제 금지
- `V35~V40` 마이그레이션 — 미커밋이지만 작업 진행 중, 버전 번호 충돌 주의
