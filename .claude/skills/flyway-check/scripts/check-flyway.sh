#!/bin/bash
# Flyway 버전 크로스체크 — PeakMate 전용
# DB: peakmate-pg 컨테이너, 포트 55432

echo "=== Flyway 버전 크로스체크 ==="

# DB 버전 확인
DB_VERSION=$(docker exec -i peakmate-pg psql -U peakmate -d peakmate -t -c \
  "SELECT MAX(CAST(REPLACE(version, '.', '') AS INTEGER)) FROM flyway_schema_history" 2>/dev/null | tr -d ' ')

if [ -z "$DB_VERSION" ] || [ "$DB_VERSION" = "" ]; then
  echo "DB  MAX 버전: 접속 불가 (docker peakmate-pg)"
  DB_VERSION=0
else
  echo "DB  MAX 버전: V${DB_VERSION}"
fi

# 로컬 파일 버전 확인
MIGRATION_DIR="backend/src/main/resources/db/migration"
LOCAL_VERSION=$(ls "${MIGRATION_DIR}"/V*.sql 2>/dev/null | sed 's/.*V\([0-9]*\)__.*/\1/' | sort -n | tail -1)

if [ -z "$LOCAL_VERSION" ]; then
  echo "로컬 MAX 버전: 파일 없음"
  LOCAL_VERSION=0
else
  echo "로컬 MAX 버전: V${LOCAL_VERSION}"
fi

# 다음 버전 계산
if [ "$DB_VERSION" -gt "$LOCAL_VERSION" ]; then
  NEXT=$((DB_VERSION + 1))
else
  NEXT=$((LOCAL_VERSION + 1))
fi

echo "다음 사용 가능: V${NEXT}"
