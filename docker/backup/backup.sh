#!/bin/bash
# Peakmate PostgreSQL 백업 스크립트
# 환경변수로 설정을 주입합니다.

set -euo pipefail

# 설정
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-55432}"
DB_NAME="${DB_NAME:-peakmate}"
DB_USER="${DB_USER:-peakmate}"
DB_PASSWORD="${DB_PASSWORD:-peakmate}"
BACKUP_DIR="${BACKUP_DIR:-/opt/peakmate/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/peakmate_${TIMESTAMP}.sql.gz"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

echo "=== Peakmate DB Backup ==="
echo "Time: $(date)"
echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "Backup to: ${BACKUP_FILE}"

# pg_dump 실행
PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom --compress=9 \
    --verbose \
    -f "${BACKUP_FILE}" 2>&1

if [ $? -eq 0 ]; then
    FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup successful: ${BACKUP_FILE} (${FILESIZE})"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

# 오래된 백업 삭제
echo "Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "peakmate_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print 2>/dev/null || true

echo "=== Backup Complete ==="
