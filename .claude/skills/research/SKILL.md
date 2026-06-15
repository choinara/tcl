---
name: research
description: 코드베이스 리서치 수행. 바이브코딩 1단계. 메뉴코드와 기능명을 인자로 전달.
argument-hint: "[menuCode] [기능명]"
user-invocable: true
context: fork
agent: researcher
allowed-tools: Read Glob Grep Agent Bash
---

# /research — 코드베이스 리서치

바이브코딩 1단계(리서치)를 수행한다.

## 입력

- `$ARGUMENTS[0]` — 메뉴코드 (예: MM0080)
- `$ARGUMENTS[1]` — 기능명 (예: 시간당생산량)

## 리서치 원칙

- 코드베이스를 깊이 읽고 동작 방식 파악
- 기존 코드, 문서를 꼼꼼하게 점검
- 관련 산출물이 있으면 먼저 점검:
  - `docs/20_peakmate_docs/` — 자체 산출물
  - `docs/12_dogeum_docs/설계서_실행계획_업무 도메인/` — 참고 자산
- **화면 이미지·와이어프레임·엑셀 목업이 제공된 경우** `docs/20_peakmate_docs/29_템플릿/화면설계_체크리스트.md` 의 10단계를 순서대로 적용하여 UI/UX 분석 결과를 보고서에 포함

## 수행 절차

1. 현재 프로젝트 상태 확인 (`git status`, 마이그레이션 버전)
2. 관련 코드베이스 탐색:
   - 백엔드: `backend/src/main/java/com/peakmate/backend/` 하위
   - 프론트: `frontend/src/domains/` 하위
   - 공통: `peakmate-core/src/`, `peakmate-core-be/src/`
   - 파일 구조 지도: `docs/claude/파일구조.md` 참조
3. 기존 유사 기능 패턴 분석 (같은 도메인의 다른 메뉴 참조)
4. DB 마이그레이션 현황 확인 (`ls backend/src/main/resources/db/migration/V*.sql | sort -V | tail -5`)
5. 상세보고서 작성

## 산출물

`docs/20_peakmate_docs/` 하위 적절한 경로에 `{기능명}_research.md` 파일 생성.

## 완료 후

"리서치 완료. 검토해주세요." 출력 후 대기. "Plan 작성해"라고 할 때까지 다음 단계로 진행하지 않는다.
