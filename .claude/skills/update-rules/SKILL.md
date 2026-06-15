---
name: update-rules
description: 바이브코딩 규칙을 문서 세트에 동시 갱신한다. 새 규칙 내용을 인자로 전달.
argument-hint: "[규칙 내용]"
user-invocable: true
context: fork
agent: rule-updater
allowed-tools: Read Edit Glob Grep
---

# /update-rules — 바이브코딩 규칙 갱신

규칙 문서와 개발 가이드를 동시에 일관되게 반영한다.

## 입력

- `$ARGUMENTS` — 추가/변경할 규칙 내용 (예: "Rule 18: reactiveCustomComponents={true} 필수")

## 대상 문서 (6개)

### 규칙 문서 (4개)
1. `.claude/CLAUDE.md` — 프로젝트 하네스 설정
2. `CLAUDE.md` (프로젝트 루트) — 프로젝트 컨텍스트
3. `docs/peakmate 바이브코딩 개론.md` — 바이브코딩 개론
4. `docs/필독_바이브코딩_조사_계획_주석_실행.md` — 단계별 상세 규칙

### 개발 가이드 (2개) — 코딩 패턴 변경 시 필수 갱신
5. `docs/claude/백엔드-개발가이드.md` — 4-layer, Entity/DTO/Repository 패턴
6. `docs/claude/프론트엔드-개발가이드.md` — PeakEditGrid, 페이지 구조, 에러 처리

## 수행 절차

1. 6개 문서를 모두 읽기
2. 현재 최대 Rule 번호 확인 → 새 번호 자동 채번
3. 기존 Rule과 충돌 여부 확인 → 충돌 시 보고
4. 규칙 문서(1~4): Rule 번호와 함께 일관되게 반영
5. 개발 가이드(5~6): 패턴 변경이라면 해당 절에 예시 코드 + 금지 패턴 함께 추가
6. 변경 diff 출력

## 갱신 판단 기준

- **규칙 문서만**: 정책/원칙 변경 (예: "커밋은 명시 지시 후")
- **개발 가이드 포함**: 코딩 패턴/네이밍/API 사용법 변경 (예: "Rule 8-7 peakmate-core 컴포넌트 사용 규칙")
- **개발 가이드만**: 신규 패턴 추가지만 규칙은 변경 없음 (예: 신규 템플릿 스켈레톤 사용법)

## 완료 후

"문서 N개 갱신 완료" + 갱신된 문서 목록 + 주요 diff 요약.
