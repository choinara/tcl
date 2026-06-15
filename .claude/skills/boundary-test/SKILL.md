---
name: boundary-test
description: DB 스키마/JPA Entity/Request DTO 간 경계값 불일치 정적 분석
user-invocable: true
---

# 경계값 테스트 자동 분석 스킬

Spring Boot + JPA + PostgreSQL 프로젝트의 경계값 테스트를 정적 분석으로 수행합니다.
DB 스키마 ↔ JPA Entity ↔ Request DTO ↔ Controller 간 불일치를 탐지합니다.

## 실행 파라미터

$ARGUMENTS

- 파라미터 없음: 프로젝트 전체 분석
- 엔티티명 지정: 해당 엔티티 관련만 분석 (예: AdminUser, SystemBulletin)
- "report" 지정: 불일치 항목만 요약 출력

## 분석 절차

다음 4단계를 순서대로 수행하세요.

### 1단계: DB 스키마 수집

프로젝트 내 `**/db/migration/*.sql` 파일을 모두 읽고 (bin/, build/ 제외), 각 테이블의 컬럼별로 다음을 추출합니다:
- 컬럼명, 데이터 타입 (VARCHAR 길이 포함)
- NOT NULL 여부
- DEFAULT 값
- UNIQUE 제약
- CHECK 제약
- FK 참조

ALTER TABLE로 추가/변경된 컬럼도 최종 상태에 반영합니다.

### 2단계: JPA Entity 수집

프로젝트 내 `**/entity/*.java` 파일을 모두 읽고 (build/ 제외), 각 필드별로 다음을 추출합니다:
- 필드 타입 (String, Long, LocalDateTime 등)
- `@Column` 속성 (name, length, nullable, columnDefinition)
- `@Size` (min, max)
- `@NotNull`, `@NotBlank`, `@NotEmpty`
- `@Enumerated` (STRING/ORDINAL)
- `@Convert` (암호화 등)

### 3단계: Request DTO 수집

프로젝트 내 `**/dto/request/*.java` 파일과 Controller에서 `@RequestBody`로 받는 타입을 모두 읽고:
- `@Valid` 사용 여부
- `@NotBlank`, `@NotNull`, `@Size`, `@Pattern`, `@Email` 등 검증 어노테이션
- Controller에서 `Map<String, Object>`를 직접 사용하는 경우 수동 검증 유무

### 4단계: 대조 분석 및 리포트

아래 규칙으로 3개 레이어를 대조합니다:

**DB ↔ Entity 비교:**
- DB VARCHAR(N)인데 Entity `@Size(max=M)`에서 M > N → [FAIL] DB 길이 초과 가능
- DB VARCHAR(N)인데 Entity에 `@Size` 없음 → [WARN] 길이 검증 누락
- DB NOT NULL인데 Entity에 `@NotNull`/`@NotBlank` 없음 → [WARN] null 검증 누락
- DB에 CHECK 제약이 있는데 Entity에 대응 검증 없음 → [WARN]
- Entity `@Column(length=M)` 값이 DB VARCHAR(N)과 다름 → [FAIL] 불일치

**Entity ↔ DTO 비교:**
- Entity `@Size(max=N)`인데 DTO에 검증 없음 → [WARN] 입력 검증 누락
- Entity NOT NULL 필드인데 DTO에 `@NotBlank`/`@NotNull` 없음 → [WARN]
- DTO `@Size(max=M)`이 Entity `@Size(max=N)`과 다름 → [FAIL] 불일치

**Controller 검증:**
- `@RequestBody`에 `@Valid` 없음 → [FAIL] 검증 미적용
- `Map<String, Object>` 직접 사용 시 수동 타입/길이 검증 없음 → [FAIL]
- 페이징 파라미터 (page, size)에 음수/최대값 제한 없음 → [WARN]

## 리포트 출력 형식

아래 형식을 정확히 따릅니다:

```
═══════════════════════════════════════════════
  경계값 테스트 리포트
  대상: {프로젝트명} | 분석 시각: {날짜}
═══════════════════════════════════════════════

■ 요약
  테이블 수: N개 | 엔티티 수: N개 | DTO 수: N개
  FAIL: N건 | WARN: N건 | PASS: N건

■ 상세 결과

[테이블명: xxx]

  ┌─ 필드명 ───────────────────────────────────
  │ DB:     타입 제약조건
  │ Entity: 어노테이션
  │ DTO:    어노테이션
  │ 결과:   PASS/FAIL/WARN + 사유
  │ 조치:   (FAIL인 경우만) 구체적 수정 방법
  └────────────────────────────────────────────

■ Controller 검증

  [컨트롤러명.메서드명]
  결과 — 사유
  조치: 수정 방법

■ 경계값 테스트 케이스 (FAIL 항목만)

  테이블.필드:
    | 입력값          | 예상 결과  | 실제 예상    |
    |----------------|-----------|-------------|
    | 경계값          | 기대동작   | 실제 예측    |
```

## 자동 수정

FAIL 항목에 대해 구체적인 코드 수정을 제안합니다.
사용자가 "수정해줘"라고 하면 제안된 수정을 실제 코드에 적용합니다.
