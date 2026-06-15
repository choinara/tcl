---
name: rule8-audit
description: Rule 8-1~8-5 자동 검증. AuditableEntity 누락, 에러처리 위반(alert/confirm/catch ignore), 시스템로그 누락, 코드 중복검증 누락, 드롭다운 하드코딩 검사.
argument-hint: "[scope?]"
user-invocable: true
allowed-tools: Read Glob Grep Bash
---

# /rule8-audit — Rule 8-1~8-5 자동 검증

바이브코딩 Rule 8-1 ~ 8-5의 위반 여부를 정적 분석으로 검사한다.

## 입력

- `$ARGUMENTS[0]` (선택):
  - `all` (기본) — 전체 코드베이스 검사
  - `backend` — 백엔드만
  - `frontend` — 프론트엔드만
  - `{menuCode}` — 특정 메뉴 페이지 + 컨트롤러만 (예: MM0120)

## 검증 항목

### Rule 8-1: AuditableEntity 적용
- 모든 신규 `@Entity` 클래스가 `extends AuditableEntity` 인지 확인
- `createdAt`/`updatedAt` 필드 직접 선언 금지
- `LocalDateTime.now()` 수동 호출 금지

### Rule 8-2: 프론트엔드 에러 처리
- `catch { /* ignore */ }` 또는 빈 catch 블록 검사
- `alert(` 사용 검사 (peakmate-core 포함)
- `confirm(`, `window.confirm(` 사용 검사
- `.catch(() => null)`, `.catch(() => {})` fire-and-forget 검사
- `console.error(e)` 단독 사용 (notify 병행 없음) 검사
- peakmate-core 내부 `@/shared/` import 검사

### Rule 8-3: 시스템 로그 기록
- CUD API 메서드(`@PostMapping`, `@PutMapping`, `@DeleteMapping`)에서 `systemLogService.log()` 호출 누락 검사
- (WARN 수준 — 일부 API는 의도적으로 미기록일 수 있음)

### Rule 8-4: 기준정보 코드 중복검증
- `batchSave` 메서드의 `case "created"` 블록에서 `findByXxxCode()` 호출 누락 검사
- 코드 필드가 있는 엔티티에 `@Column(unique = true)` 또는 DB UNIQUE 제약 누락 검사

### Rule 8-5: 드롭다운 공통코드 관리
- `cellEditorParams: { values: [...]}`에 하드코딩 배열 검사 (`useCommonCodes` 미사용)
- 페이지에서 한국어/영문 상수 배열 정의 후 드롭다운 사용 검사

## 실행

```sh
${CLAUDE_SKILL_DIR}/scripts/rule8-audit.sh "$ARGUMENTS"
```

스크립트는 1차 grep 결과를 출력한다. 출력 검토 후 false positive를 제외하고 최종 리포트 작성.

## 출력 형식

```
═════════════════════════════════════════════════════════
  Rule 8-1~8-5 자동 검증 리포트
  scope: {all/backend/frontend/menuCode}
  실행일: YYYY-MM-DD HH:MM
═════════════════════════════════════════════════════════

[Rule 8-1] AuditableEntity 적용
─────────────────────────────────────────────────────────
검사 대상: N개 엔티티 파일
위반: {파일경로} — extends AuditableEntity 누락
위반: {파일경로} — createdAt 직접 선언
결과: PASS / FAIL (위반 N건)

[Rule 8-2] 프론트엔드 에러 처리
─────────────────────────────────────────────────────────
검사 대상: N개 .tsx/.ts 파일
- alert() 사용: N건
  {파일경로}:{줄번호}
- confirm() 사용: N건
- catch { } / catch ignore: N건
- .catch(() => null): N건
- console.error 단독: N건 (notify 병행 누락)
결과: PASS / FAIL (위반 N건)

[Rule 8-3] 시스템 로그 기록
─────────────────────────────────────────────────────────
검사 대상: N개 Controller 파일, M개 CUD 메서드
SystemLogService 미사용 의심: K건
  {파일경로}: {메서드명} — POST/PUT/DELETE 인데 로그 호출 없음
결과: WARN (의도적 미기록 가능성 — 수동 검토 필요)

[Rule 8-4] 기준정보 코드 중복검증
─────────────────────────────────────────────────────────
검사 대상: N개 Master 컨트롤러, M개 엔티티
- batchSave에서 findByXxxCode 누락: K건
- 코드 필드 + UNIQUE 누락: K건
결과: PASS / FAIL (위반 N건)

[Rule 8-5] 드롭다운 공통코드 관리
─────────────────────────────────────────────────────────
검사 대상: N개 페이지 파일
- cellEditorParams values 하드코딩 의심: K건
  {파일경로}:{줄번호}: values: ['A', 'B', 'C']
결과: WARN (수동 검토 필요 — isActive 'Y'/'N' 등은 정상)

═════════════════════════════════════════════════════════
종합 결과: 위반 N건, 경고 M건
권장 조치:
  1. {위반 항목} → {수정 방향}
  2. ...
═════════════════════════════════════════════════════════
```

## 후속 조치

위반 항목 발견 시:
1. **진단과 수정을 분리** — 본 스킬은 진단만 수행
2. 사용자에게 위반 리스트 보고
3. 사용자 지시("수정해")가 있을 때만 수정 진행
4. 수정 시 한 번에 하나의 파일씩 (Rule 9 — 파일 변경 범위 제한)

## 한계

- 정적 분석 기반 → 일부 false positive 발생 가능
- false negative도 있음 (예: 동적 함수 호출은 검출 못함)
- 의도적 예외(예: 디버그 alert)는 수동 검토 필요
- `/build` 스킬의 Step 7(GS인증 자체 점검)에서 본 스킬을 자동 호출하도록 통합 권장
