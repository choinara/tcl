#!/bin/bash
# Peakmate PostgreSQL 복원 스크립트
# 사용법: ./restore.sh <백업파일경로>

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "사용법: $0 <백업파일경로>"
    echo "예시: $0 /opt/peakmate/backups/peakmate_20260314_030000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-55432}"
DB_NAME="${DB_NAME:-peakmate}"
DB_USER="${DB_USER:-peakmate}"
DB_PASSWORD="${DB_PASSWORD:-peakmate}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: 백업 파일을 찾을 수 없습니다: ${BACKUP_FILE}"
    exit 1
fi

echo "=== Peakmate DB Restore ==="
echo "Time: $(date)"
echo "Backup file: ${BACKUP_FILE}"
echo "Target: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo ""
echo "WARNING: 이 작업은 현재 데이터베이스를 덮어씁니다!"
read -p "계속하시겠습니까? (y/N): " CONFIRM

if [ "${CONFIRM}" != "y" ]; then
    echo "복원이 취소되었습니다."
    exit 0
fi

echo "Restoring..."
PGPASSWORD="${DB_PASSWORD}" pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --clean --if-exists \
    --verbose \
    "${BACKUP_FILE}" 2>&1

if [ $? -eq 0 ]; then
    echo "Restore successful!"
else
    echo "WARNING: 일부 오류가 발생했을 수 있습니다. 로그를 확인하세요."
fi

echo "=== Restore Complete ==="
