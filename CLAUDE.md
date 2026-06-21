# TCL 프로젝트 컨텍스트

> 이 파일은 **사실 기록(컨텍스트)**이다. 결정사항, 주의사항, 현재 상태만 남긴다.
> 행동규칙/바이브코딩 룰 → 글로벌 `~/.claude/CLAUDE.md`
> 하네스 설정/스킬 목록 → `.claude/CLAUDE.md`
> 세션 이력 → `myclaudemd/CLAUDE.md`

## 프로젝트 개요

- **프로젝트명**: TCL (물류 이메일 자동화 + 스크래핑 + RAG 챗봇)
- **기반**: PeakMate 코드베이스 복사 후 TCL 전용으로 커스터마이징 (2026-06-15)
- **핵심 기능**: IMAP 이메일 수신 → AI 분류/자동회신 → pgvector RAG → WebSocket 실시간 알림 → Playwright 스크래핑

---

## 결정사항 (앞으로 바꾸지 말 것)

### 아키텍처
- **백엔드**: Spring Boot 3.5.7 + JPA + Java 21, 4-layer (interfaces/application/domain/infra)
- **백엔드 공유 라이브러리**: `peakmate-core-be/` (com.peakmate.core.*) — AuditableEntity, ApiResponse, @RequirePermission, @PiiExportGuard, @ConfigurationProperties 설정
- **@RequirePermission menus[] OR 조건**: `menus={"AA0030","AA0031"}` 형태로 복수 메뉴코드 지원. 단일 메뉴는 `menu="AA0030"` 그대로 사용 가능 (하위 호환)
- **프론트엔드**: React 19 + Vite + TypeScript + Zustand + TanStack Query
- **공통 컴포넌트**: `peakmate-core` 패키지 (grid, layout, ui, auth, error)
- **그리드**: `PeakDataGrid`(읽기전용, queryUrl 필수, data prop 없음) / `PeakEditGrid`(편집, data+permission prop 필수) 이원화
- **PeakDataGrid 1시간 캐시**: 모듈 레벨 Map 캐시(TTL 1h) 내장. 페이지 재진입 시 캐시 우선 → 조회 버튼 클릭 시 서버 재조회 + 캐시 갱신
- **공통 라이브러리 변경**: peakmate-core, peakmate-core-be 수정 전 "수정 대상/현재 동작/변경 내용/영향 범위/사유" 보고 후 승인

### TCL 도메인 기술 스택 (2026-06-14 확정)

| 항목 | 결정 |
|------|------|
| 이메일 수신 (IMAP 폴링) | Java Spring JavaMail (EmailImportService) |
| 이메일 분류/자동회신 | Python → Claude API (anthropic SDK) |
| 벡터 DB | PostgreSQL pgvector (email_embeddings 테이블) |
| 임베딩 생성 | OpenAI text-embedding-3-small (API 기반) |
| 실시간 알림 | Spring WebSocket + Teams Webhook 병행 |
| 스크래핑 주력 | Python Playwright (정형 반복 수집) |
| 스크래핑 보조 | Playwright MCP (비정형·AI 판단 필요 케이스) |
| 스케줄러 역할 분담 | APScheduler(Python): 스크래핑·임베딩 배치 / Spring TaskScheduler(Java): IMAP·알림·Teams |

### Python 환경 규칙
- **macOS 개발**: `conda env tcl` (Python 3.11.15) + pip only. `conda install` 절대 금지
- **Linux 납품**: `python/.venv/bin/python` (venv + pip install -r requirements.txt)
- **conda install 금지 이유**: pip freeze가 오염되어 Linux 납품 환경 재현 불가
- **Python 인터프리터**: `/opt/anaconda3/envs/tcl/bin/python`
- **패키지 목록**: `python/requirements.txt` (pip freeze 출력, 51개 패키지)

### pgvector
- **DB**: `tcl` (전용 `tcl-pg` Docker 컨테이너, 포트 55433)
- **테이블**: `email_embeddings` (V88 SQL 참조, Flyway 미사용 — 직접 생성)
- **임베딩 차원**: 1536 (OpenAI text-embedding-3-small)
- **인덱스**: HNSW + cosine 유사도

### 엔티티 패턴
- 모든 엔티티: `extends AuditableEntity` 필수. `createdAt`/`updatedAt` 직접 선언 금지, `LocalDateTime.now()` 수동 호출 금지
- 팩토리 메서드 `create()`/`update()` 패턴 유지 (생성자 직접 호출 금지)

### 네이밍 규칙
- 백엔드 패키지: `com.peakmate.backend.{layer}.{domain}` (PeakMate에서 복사, 패키지명 변경은 향후 결정)
- 프론트 도메인: `frontend/src/domains/{domain}/{feature}/ui/{Page}.tsx`
- 메뉴코드: 대문자 약어 + 4자리 숫자. 상태코드: 한글 문자열
- JWT 토큰 용어: **refreshToken** 통일 (pollingToken 금지)
- 모든 도메인 API 응답: camelCase 표준

### API 패턴
- 응답 래핑: `ApiResponse<T>`. 인증: JWT HttpOnly 쿠키 + `@RequirePermission`. 일괄 저장: `POST /batch`

### JWT / 인증 보안
- RS256 (JJWT 0.12.6), `keys/jwt-private.pem`(서명) / `keys/jwt-public.pem`(검증)
- Access Token: 30분 + jti UUID (세션 DB 저장). Refresh Token: 1시간. 절대 타임아웃: 8시간
- 저장: HttpOnly 쿠키만 (localStorage 금지). Claims: roles만 (개인정보 미포함)
- 갱신: 만료 5분 전. 비밀번호 변경 시 전체 세션 무효화. 프론트 타이머: 15분마다 체크

### 계정 보안
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

### 신규 메뉴 등록 프로세스
- 5개 필수: ① `system_menu` INSERT (`use_yn='Y'`) ② `App.tsx` Route+pathToMenuCode ③ `menuConfig.ts` 폴백 ④ `@RequirePermission` ⑤ `usePermission()`
- DB 변경 후 **로그아웃 → 재로그인** 필요. 구현 후 `/menu-verify {코드}` 8개 항목 검증

### DB 마이그레이션
- **Flyway 미사용** — 테이블 직접 CREATE, 데이터 직접 INSERT
- `backend/src/main/resources/db/migration/` 폴더는 참조용 SQL 보관 (자동 실행 안 됨)
- V88: pgvector + email_embeddings 스키마 (참조용)
- V89: TCL 메뉴 초기 데이터 (참조용, 직접 실행 필요)
- FK 없이 논리 참조. 캐시 필드: `code`(참조)+`name`(캐시) 병행

### 설계서 저장 경로
- TCL 산출물: `/Users/hschoi/Documents/Git/CHS/docs/22_TCL/`
- 설계 문서: `/Users/hschoi/Documents/Git/CHS/docs/22_TCL/223_클로드 문서/2232_설계/`
- 리서치: `/Users/hschoi/Documents/Git/CHS/docs/22_TCL/223_클로드 문서/2231_리서치/`
- 완료 문서: `/Users/hschoi/Documents/Git/CHS/docs/22_TCL/223_클로드 문서/2239_완료문서/`
- 완료 문서 파일명: `TCL_{기능명}_완료_{YYMMDD}.md`

---

## 다음 할 일

> `myclaudemd/CLAUDE.md` 에서 관리 — `/session-save` 저장, `/session-load` 복기

---

## 주의사항 (건드리면 안 되는 것)

### 환경 설정
- 포트: 백엔드 **8096**, 프론트 **5182**, DB **55433** (tcl-pg Docker 컨테이너)
- `frontend/.env`: `VITE_API_URL=http://localhost:8096`
- `backend/.env`: TCL 실값 완료 (DB_URL=55433, DB_USERNAME=tcl, ANTHROPIC_API_KEY 고객사 제공 예정)
- 백엔드 `application.yml` 프로파일: local/dev/prod 분리 유지
- Flyway 미사용 — `spring.flyway` 설정 제거 완료

### 의존성
- AG Grid 35.1.0 — 라이선스 버전, 업그레이드 시 호환성 확인 필수
- React 19.2.0, Java 21 (Zulu) — 다운그레이드 금지
- `html5-qrcode` — 바코드 스캔용, 제거 금지
- `python/requirements.txt` — pip freeze 순수 출력 유지. conda install 혼입 금지

### 공통 컴포넌트 패턴
- **`@peakmate/core` 배럴 import 금지** — Vite pre-bundle `export *` + default 충돌(SyntaxError). 개별 path alias 사용: `@/components/ui/X`, `@/hooks/X`, `@/lib/X`
- `PeakDataGrid` / `PeakEditGrid` 내부 구조 임의 변경 금지 (전체 페이지 영향)
- `authFetch` 인증 흐름: HttpOnly 쿠키 + `credentials: 'include'` — localStorage 금지
- **shadcn/ui**: 컴포넌트는 `frontend/src/components/shadcn/`에 직접 작성. `@/components/ui`는 peakmate-core 전용
- **PremiumCard**: glassmorphism 전용 (`neo-glass` 클래스 하드코딩) — 일반 배경에 적용 금지

### 커밋/보안 제약
- 실행계획서/리서치 산출물(`docs/`)은 Git 커밋 제외 (.gitignore)
- localStorage에 토큰 저장 금지. JWT Claims에 개인정보 포함 금지
- `CommonCodeUsageChecker.USAGE_MAP`은 소스코드 상수만 (외부 입력 금지)
- pre-commit hook(`--no-verify`) 우회 금지. 커밋된 마이그레이션 파일 수정 금지
- 메모리 저장, 문서 수정, 결정사항 반영 등은 컨펌 없이 진행 금지
- 모든 경로는 절대경로로만 표시
- `python/.env` — Git 추적 금지 (실 API 키 포함)

### 미완료 Group B 항목
- B-6: EmailImportService IMAP 폴링 코드 (복수 계정 지원)
- B-7: EmailClassifyService TCL 물류 도메인 분류 체계
- B-8: `backend/.env` TCL 실값 채우기 (IMAP, Teams, API 키)
- B-9: TCL 신규 메뉴 등록
