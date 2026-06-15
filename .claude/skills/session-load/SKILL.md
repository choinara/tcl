---
name: session-load
description: 새 세션 시작 시 이전 컨텍스트 복기 + 현재 상태 파악
user-invocable: true
---

# /session-load — 이전 세션 컨텍스트 복기

아래 파일을 모두 읽고 현재 프로젝트 상태를 파악해라.

## 읽을 파일 (전부 필수 — 하나도 빠뜨리지 마라)

> `~/.claude/CLAUDE.md`와 `.claude/CLAUDE.md`는 Claude Code가 자동 로드한다. 별도로 읽지 않는다.

1. **`CLAUDE.md`** — 프로젝트 컨텍스트 (결정사항, 아키텍처, 주의사항, 완료된 작업, 다음 할 일)
2. **`myclaudemd/CLAUDE.md`** — 개인 작업 기록 (세션 이력, 진행 상태, 마지막으로 무엇을 했는지)
3. `/Users/hschoi/.claude-account1/projects/-Users-hschoi-Documents-Git-CHS-peakmate/memory/MEMORY.md` — 프로젝트 결정사항, 피드백 메모리 인덱스
4. `/Users/hschoi/Documents/Git/CHS/docs/오답노트.md` — **`## 목차 (카테고리별)` 섹션만** (`## 이슈 목록` 직전까지) — 카테고리별 반복 이슈 번호 파악

**1번과 2번은 반드시 둘 다 읽어야 한다.** CLAUDE.md는 "무엇이 결정되었는지", myclaudemd/CLAUDE.md는 "지금 어디까지 진행했는지"를 알려준다. 둘 중 하나만 읽으면 컨텍스트가 불완전하다.

**4번 오답노트는 목차만 읽는다.** 현재 작업과 관련 카테고리(A~H)의 이슈 번호가 보이면 해당 번호의 상세 기록(`## 상세 기록` 섹션)을 추가로 읽는다. 오류 발생 시 코드 수정 전에 반드시 확인.

## 코드 상태 확인

아래 명령을 실행하여 현재 코드 상태를 파악해라:

- 현재 브랜치: `git branch --show-current`
- 미커밋 변경: `git status --porcelain`
- 최신 마이그레이션: `ls backend/src/main/resources/db/migration/V*.sql | sort -V | tail -1`

## 보고 형식

파악한 내용을 아래 형식으로 요약해서 보고해라:

```
## 세션 복기 결과

### 1. 프로젝트 결정사항 요약
- (CLAUDE.md "결정사항" 섹션 — 아키텍처, 네이밍, 보안 등 핵심만)

### 2. 현재 진행 중인 작업
- (myclaudemd/CLAUDE.md "현재 작업" 섹션 — 마지막 세션에서 무엇을 했는지)

### 3. 다음에 해야 할 작업
- (CLAUDE.md "다음 할 일" 섹션 기반, 우선순위 순)

### 4. 주의사항
- (CLAUDE.md "주의사항" + 메모리 feedback 기반)

### 5. 코드 상태
- 브랜치: xxx
- 미커밋 변경: N건
- 최신 마이그레이션: V{N}

### 6. 사용 가능한 에이전트/스킬
- (.claude/CLAUDE.md 기반)
```

## 완료 후

"[다음 작업명] 시작할게요. 진행할까요?" 라고 물어봐라.
