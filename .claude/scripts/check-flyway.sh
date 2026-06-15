#!/bin/bash
# Flyway 마이그레이션 버전 크로스체크
# DB MAX(version) + 로컬 MAX → 다음 버전 출력

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
MIGRATION_DIR="$PROJECT_DIR/backend/src/main/resources/db/migration"

echo "=== Flyway 버전 크로스체크 ==="

# 1. 로컬 최신 버전
LOCAL_MAX=$(ls "$MIGRATION_DIR"/V*.sql 2>/dev/null | grep -oE 'V[0-9]+' | sed 's/V//' | sort -n | tail -1 || echo "0")
echo "로컬 최신: V${LOCAL_MAX}"

# 2. DB 최신 버전 (Docker PostgreSQL)
DB_MAX=$(docker exec peakmate-pg psql -U peakmate -d peakmate -t -c "SELECT COALESCE(MAX(CAST(version AS INTEGER)), 0) FROM flyway_schema_history;" 2>/dev/null | tr -d ' ' || echo "접속불가")

if [ "$DB_MAX" = "접속불가" ]; then
  echo "DB 최신: 접속 불가 (Docker 미실행?)"
  echo "→ 로컬 기준 다음 버전: V$((LOCAL_MAX + 1))"
else
  echo "DB 최신: V${DB_MAX}"
  if [ "$DB_MAX" -gt "$LOCAL_MAX" ]; then
    NEXT=$((DB_MAX + 1))
  else
    NEXT=$((LOCAL_MAX + 1))
  fi
  echo "→ 다음 버전: V${NEXT}"
fi

echo "==========================="
