---
name: flyway-check
description: Flyway 마이그레이션 버전 크로스체크. DB MAX 버전 + 로컬 MAX 버전 → 다음 사용 가능 버전 출력.
user-invocable: true
allowed-tools: Bash Read
---

# /flyway-check — Flyway 버전 크로스체크

DB와 로컬 파일의 Flyway 마이그레이션 버전을 크로스체크하여 다음 사용 가능 버전을 출력한다.

## 실행 전 필수

**다중 세션 충돌 방지**: 스킬 실행 전 반드시 원격 브랜치를 먼저 pull한다.

```sh
git pull --rebase origin $(git branch --show-current)
```

이유: 다른 세션에서 마이그레이션 파일을 이미 커밋했을 수 있다.
pull 없이 로컬 버전만 기준으로 번호를 정하면 버전 충돌 발생 (#11 #22).

## 수행

`${CLAUDE_SKILL_DIR}/scripts/check-flyway.sh` 실행 결과를 출력한다.

## 출력 예시

```
=== Flyway 버전 크로스체크 ===
DB  MAX 버전: V65
로컬 MAX 버전: V65
다음 사용 가능: V66
```
