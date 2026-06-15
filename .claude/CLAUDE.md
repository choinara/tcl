# PeakMate — 프로젝트 설정

> 하네스 설정 (에이전트/스킬/운영 방식)은 글로벌 `~/.claude/CLAUDE.md`에 정의됨.
> 글로벌 `~/.claude/skills/`는 현재(v2.1.86) 인식되지 않으므로, 스킬/에이전트는 프로젝트 `.claude/`에 유지.

## 세션/오답노트 경로

- 세션 저장 경로: `/Users/hschoi/Documents/Git/CHS/peakmate/myclaudemd/CLAUDE.md`
- 오답노트 경로: `/Users/hschoi/Documents/Git/CHS/docs/오답노트.md`

## 산출물 저장 경로

`docs/20_peakmate_docs/{카테고리}/{주제}_{단계}.md`

## 프로젝트 고유 결정사항

> 전역 Rule(~/.claude/CLAUDE.md)과 별도로 여기에만 기록.

- **패키지 매니저: npm 통일** — yarn/pnpm 사용 금지 (Rule 17)
- **peakmate-core**: 프론트엔드 공통 라이브러리. 내부 직접 수정 가능 (dogeum의 @sbfc/core와 달리 소스 레벨 접근)
- **peakmate-core-be**: 백엔드 공통 라이브러리 (Gradle java-library, com.peakmate.core.* 패키지)
- **공통 라이브러리 변경 시 사전 보고 필수**: peakmate-core, peakmate-core-be 수정 전 "수정 대상/현재 동작/필요한 변경/영향 범위/사유" 보고 → 승인 후 구현
- **DB 접속**: docker 컨테이너 `peakmate-pg`, 포트 55432
- **동일 기능/UI = 동일 코드**: 메뉴별 임의 변경 금지
- **AG Grid**: reactiveCustomComponents={true} 필수 (CheckboxFilter 등 커스텀 필터 동작에 필요)
- **하네스 운영**: 작업 유형에 따라 세션 구성을 선택한다. 아래 "세션 운영 기준표" 참조
- **Flyway 네이밍 (2026-05-05~)**: 신규 마이그레이션은 14자리 타임스탬프(`V{YYYYMMDDHHMMSS}__xxx.sql`) 권장. 기존 V1~V74 정수는 유지. `out-of-order: true` 모든 프로파일 적용. pre-commit hook은 두 형식 모두 허용
- **공통코드 코드값**: BE DTO @Pattern(`^[A-Z0-9_]+$`) 강제. batchSave 경로도 정적 검증

## 세션 운영 기준표

작업 유형에 따라 세션 구성을 다르게 선택한다. 일관된 운영을 위한 기준.

| 작업 유형 | 권장 세션 구성 | 근거 |
|----------|--------------|------|
| **신규 도메인 추가** (예: APS, AAS, 이메일 모듈 신설) | 3세션 (PMO + 설계 + 구현) | 아키텍처 설계 필요, 도메인 모델 정의, 사이드 이펙트 큼 |
| **보안·규정 변경** (예: GS인증 대응, RBAC 확장, PII 정책) | 3세션 (PMO + 설계 + 구현) | 영향 범위 광범위, 회귀 위험 큼, 독립 크로스체크 필수 |
| **공통 라이브러리 변경** (peakmate-core, peakmate-core-be) | 3세션 (PMO + 설계 + 구현) | 전체 페이지/모듈 영향, 사전 보고 + 검토 필수 |
| **기존 메뉴 확장** (컬럼 추가, 필터 추가, 검색 개선) | 단일 세션 | 패턴 기존재, 변경 범위 제한, 회귀 영향 작음 |
| **버그 수정** (특정 페이지/API 한정) | 단일 세션 | 범위 명확, 회귀 테스트 위주 |
| **리팩토링** (공통 로직 추출, 중복 제거) | 2세션 (설계 + 구현) | 설계 검토 필요, PMO는 선택사항 |
| **하네스/문서 갱신** (CLAUDE.md, 스킬, 가이드) | 단일 세션 | 코드 영향 없음, 작업 범위 명확 |
| **마이그레이션만** (DDL, 시드 데이터) | 단일 세션 | 빠른 작업, Flyway 크로스체크 필수 |

### 3세션 하이브리드 운영 방식
- **PMO 세션**: 문서 검토, 기술 자문, 규칙 관리 (수동, 바이브코딩 룰)
- **설계 세션**: 리서치 → Plan 1 → Plan 2 작성 (수동, 바이브코딩 룰)
- **구현 세션**: 하네스 적용 (`/build` 스킬 + `@builder` + 워크트리 격리)

### 단일 세션 운영 방식
- 한 세션에서 리서치 → Plan → 검토 → 구현 모두 수행
- 작업 범위가 명확하고 사이드 이펙트가 작을 때만 권장
- 코드 변경 전 plan 문서 작성은 필수 (구두 합의만으로 구현 금지)

## CLAUDE.md 3파일 역할 분리

| 파일 | 역할 | git 추적 | 갱신 주체 |
|------|------|---------|----------|
| `CLAUDE.md` (루트) | 프로젝트 컨텍스트 — 결정사항, 아키텍처, 완료 이력, 주의사항 | O | 결정사항 확정 시 |
| `myclaudemd/CLAUDE.md` | 개인 세션 이력 — 현재 작업, 진행 상태, 세션별 파일 변경 | X (.gitignore) | `/session-save` |
| `.claude/CLAUDE.md` | 하네스 설정 — 산출물 경로, 프로젝트 고유 결정사항, 에이전트/스킬 목록 | X (.gitignore) | 하네스 변경 시 |

## 개발 가이드

에이전트(@researcher, @builder)가 구현/설계 시 참조하는 코딩 패턴 가이드:

- `docs/claude/백엔드-개발가이드.md` — 4-layer, Entity/DTO/Repository 패턴, peakmate-core-be 변경 규칙
- `docs/claude/프론트엔드-개발가이드.md` — PeakEditGrid 기본값, 페이지 구조, 에러 처리, peakmate-core 변경 규칙
