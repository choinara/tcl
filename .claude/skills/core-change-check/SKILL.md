---
name: core-change-check
description: peakmate-core, peakmate-core-be 공통 라이브러리 변경 감지. 변경 발견 시 사전 보고 템플릿 강제 출력 + 승인 대기.
argument-hint: "[mode?]"
user-invocable: true
allowed-tools: Read Glob Grep Bash
---

# /core-change-check — 공통 라이브러리 변경 감지

`peakmate-core` (프론트엔드) 또는 `peakmate-core-be` (백엔드) 디렉토리에 변경이 있는지 검사하고, 변경이 있으면 사전 보고 템플릿을 출력하여 사용자 승인을 강제한다.

## 입력

- `$ARGUMENTS[0]` (선택):
  - `staged` — 스테이징된 변경만 검사 (기본)
  - `unstaged` — 워킹 디렉토리 변경 검사
  - `all` — 스테이징 + 언스테이징 모두 검사
  - `branch` — main과 비교 (현재 브랜치 diff)

## 검사 대상 경로

| 경로 | 모듈 |
|------|------|
| `peakmate-core/src/**` | 프론트엔드 공통 (Grid, Modal, Hooks, Stores, Layout) |
| `peakmate-core-be/src/**` | 백엔드 공통 (ApiResponse, AuditableEntity, JWT, @RequirePermission) |

## 실행

```sh
${CLAUDE_SKILL_DIR}/scripts/core-change-check.sh "$ARGUMENTS"
```

스크립트는 변경된 공통 라이브러리 파일 목록과 사전 보고 템플릿을 출력한다.

## 출력 형식

### 변경 없음
```
═════════════════════════════════════════════════════════
  공통 라이브러리 변경 검사: PASS
  scope: staged|unstaged|all|branch
═════════════════════════════════════════════════════════
peakmate-core: 변경 없음
peakmate-core-be: 변경 없음
─────────────────────────────────────────────────────────
정상 진행 가능.
```

### 변경 발견
```
═════════════════════════════════════════════════════════
  공통 라이브러리 변경 감지: 사전 보고 필요
═════════════════════════════════════════════════════════

[peakmate-core 변경]  ← 또는 [peakmate-core-be 변경]
변경 파일 (N건):
  M peakmate-core/src/components/grid/PeakEditGrid.tsx
  A peakmate-core/src/hooks/useNewHook.ts
  ...

─────────────────────────────────────────────────────────
※ 공통 라이브러리는 전체 프로젝트에 영향을 미친다.
※ 구현 전 사전 보고 + 사용자 승인 필수 (.claude/CLAUDE.md 규칙).
─────────────────────────────────────────────────────────

[사전 보고 작성 템플릿]

```
[peakmate-core 변경 필요]   ← 또는 [peakmate-core-be 변경 필요]

- 수정 대상: {컴포넌트/훅/클래스 이름}
- 현재 동작: {현재 어떻게 동작하는지 한 줄}
- 필요한 변경: {구체적으로 어떤 변경이 필요한지}
- 영향 범위: {기존 페이지/모듈에 미치는 영향 — grep으로 확인}
- 사유: {왜 이 변경이 필요한지 — 대안 검토 결과 포함}
```

위 템플릿을 작성하여 사용자에게 보고하고 승인 후 진행하라.
승인 없이 변경한 경우 git restore로 되돌릴 것.
```

## /build 스킬 통합

`/build` 스킬의 Step 0(워크트리 생성 직후)에 본 스킬을 호출하여,
워크트리 시작 시점부터 공통 라이브러리 변경을 추적할 것을 권장.

## 영향 범위 확인 (grep 도우미)

변경 파일이 어디서 사용되는지 빠르게 파악:

```sh
# peakmate-core 컴포넌트 사용처 (frontend 전체)
grep -rn "PeakEditGrid" /Users/hschoi/Documents/Git/CHS/peakmate/frontend/src/

# peakmate-core-be 클래스 사용처 (backend 전체)
grep -rn "AuditableEntity" /Users/hschoi/Documents/Git/CHS/peakmate/backend/src/
```

## 한계

- git이 추적하지 않는 파일(.gitignore 대상)은 검사 못함
- 워크트리 내부에서는 worktree의 git 상태를 검사 (main과 차이가 있음)
- false negative: rename으로 변경된 파일은 git이 별도 표시 (`R` status)
- false positive: 자동 생성 파일이 변경된 경우 (테스트 출력 등)

## 후속 조치

변경 발견 시:
1. **진단과 수정을 분리** — 본 스킬은 진단만
2. 사용자에게 변경 리스트 + 사전 보고 템플릿 출력
3. 사용자가 사전 보고 후 승인하면 진행
4. 승인 없는 변경은 `git restore peakmate-core/ peakmate-core-be/` 로 되돌릴 것
