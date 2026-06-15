---
name: remind
description: 바이브코딩 전체 규칙(Rule 1-17), 완료 체크리스트, 보안 인프라 현황 출력.
user-invocable: true
allowed-tools: Read Bash
---

# /remind — 전체 규칙 리마인드

수동 구현 세션 시작 시 실행. 바이브코딩 전체 규칙과 현재 프로젝트 상태를 출력한다.

## 출력 항목

### 1. 핵심 원칙

- 모든 단계 전환은 사용자 명시적 지시만
- "구현해", "실행해" 등 명확한 실행 지시가 있을 때만 구현
- **문제 발견 시 진단과 수정을 분리한다** — 같은 응답에서 Edit/Write 호출 금지
- 실행계획서에 없는 파일 수정은 보고 후 승인
- 커밋/푸시는 매번 명시적 지시 필요
- 이슈 보고 2단계: 1차는 리스트+한줄 메모, 2차는 사용자 지정 시만
- 산출물 문서에 이모지 금지

### 2. 구현 세부 규칙 (Rule 1-17)

**Rule 1.** 모든 작업 완료될 때까지 멈추지 마라. 타입체크·빌드 에러 또는 컨펌 필요 시에만 멈추고 보고.

**Rule 2.** any/unknown 타입 금지. 모든 함수·메서드에 파라미터와 리턴 타입 명시. 제네릭 제약 조건 명확히.

**Rule 3.** 각 작업 단계 끝에 `tsc --noEmit` 실행, 에러 0인 상태에서만 다음 단계. 내 변경으로 다른 파일에서 발생한 에러도 수정.

**Rule 4.** import 경로를 추측하지 말고 실제 파일 위치 확인. 순환 의존 주의.

**Rule 5.** 기존 테스트 보호. 내 변경으로 테스트 실패 시 구현을 먼저 점검. 테스트 수정이 불가피하면 이유 명시.

**Rule 6.** 더미 데이터·임시 URL·매직 넘버 금지. TODO/FIXME/HACK 미완성 표시 금지.

**Rule 7.** 에러 발생 시 근본 원인 분석. 동일 명령 반복 실행·무작위 코드 변경 금지. 3회 반복 시 멈추고 보고.

**Rule 8.** DB 마이그레이션: Flyway 사용, 타임스탬프 형식(`V{YYYYMMDDHHMMSS}__xxx.sql`) 권장, out-of-order: true. 정수 사용 시 MAX(DB,로컬)+1 크로스체크. DROP 시 같은 파일에 CREATE 필수.

**Rule 9.** 하나의 파일에 여러 기능 동시 추가 금지. 300줄 초과 변경 시 분리 검토.

**Rule 10.** 기존 파일 삭제·이동 시 사전 컨펌. 삭제 전 참조처 확인.

**Rule 11.** 부분 완료는 완료가 아님. 백엔드+프론트엔드 체크리스트 모두 통과해야 완료.

**Rule 12.** 작업 단계 1개 완료마다 커밋. 커밋/푸시는 매번 명시적 지시 필요.

**Rule 13.** 해결 불가능한 문제 발생 시 변경사항 되돌리고 마지막 정상 커밋으로 복구. 사용자 지시 없이 우회 금지.

**Rule 14.** 단계 시작 시 현재 진행 단계 번호와 직전 완료 단계 명시. 재개 시 계획 문서·파일 상태 재확인.

**Rule 15.** SQL Injection·XSS 방어는 기존 공통 패턴 사용. API마다 인증·인가 체크. 민감 정보 로그 출력 금지.

**Rule 16.** 목록 조회 API는 페이징 또는 가상 스크롤 적용. N+1 쿼리 방지.

**Rule 17.** npm 통일. yarn/pnpm 금지. `npm install`, `npm run <script>`.

### 3. 완료 체크리스트

**[백엔드]**
- [ ] `./gradlew compileJava` 성공
- [ ] 단위 테스트 작성 + `./gradlew test` 통과
- [ ] 신규 API: `@RequirePermission(menu=..., action=...)` 적용
- [ ] 신규 엔티티: `extends AuditableEntity` 적용
- [ ] SystemLog 호출 추가 (해당 시)
- [ ] 신규 컨트롤러: ApiResponse 래핑
- [ ] Flyway 마이그레이션: 로컬+DB 크로스체크 완료

**[프론트엔드]**
- [ ] `npm run type-check` 성공
- [ ] `npm run lint` 통과
- [ ] `npm run test:run` 통과
- [ ] 신규 페이지: 브라우저 실제 동작 확인
- [ ] PeakEditGrid: `permission={perm}` 전달
- [ ] 신규 페이지: `usePermission(MENU_CODE)` 적용
- [ ] 신규 페이지: `useTranslation` + `t()` 적용
- [ ] `alert()`/`confirm()` 사용 0건
- [ ] 신규 페이지: `<PageTitle menuCode={MENU_CODE} />` — label 하드코딩·title prop 금지

**[신규 메뉴 추가 시 추가]**
- [ ] system_menu INSERT (use_yn='Y')
- [ ] App.tsx Route + pathToMenuCode 등록
- [ ] menuConfig.ts 폴백 등록
- [ ] `/menu-verify {코드}` 8개 항목 검증
- [ ] 로그아웃 → 재로그인 후 사이드바 확인
- [ ] i18n `menu.{menuCode}` 번역 키 등록 (ko/en 최소)

### 4. 보안 인프라 현황 (중복 구현 금지)

- 계정 잠금: `AdminUser.incrementFailedLogin()` (5회→30분)
- 비밀번호: `PasswordPolicyService` (90일 만료, 재사용 3개, 12자리+)
- 인코딩: `MigrationPasswordMatcher` (PBKDF2+BCrypt)
- MFA: `TotpService` (TOTP)
- PII 암호화: `EncryptedStringConverter` (AES-256-GCM 5필드)
- PII 감사: `PiiAuditService`, `@PiiExportGuard`
- PIPA 동의: `ConsentHistory`, `ConsentController`
- 로그인 시도: `LoginAttemptService`
- 스케줄러: 02시 휴면비활성화, 03시 로그파기+익명화, 04시 세션정리

### 5. 현재 프로젝트 상태

아래 명령 실행 후 출력:

```bash
git status --short | head -10
git log --oneline -3
ls backend/src/main/resources/db/migration/V*.sql 2>/dev/null | sort -V | tail -3
```
