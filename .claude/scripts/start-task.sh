#!/bin/bash
# 작업 시작 전처리 — 현재 상태 확인 + 바이브코딩 리마인드
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

echo "=== 작업 시작 전처리 ==="

# 1. 현재 브랜치
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "unknown")
echo "📌 현재 브랜치: $BRANCH"

# 2. Flyway 최신 버전 (로컬)
LATEST_LOCAL=$(ls "$PROJECT_DIR"/backend/src/main/resources/db/migration/V*.sql 2>/dev/null | sort -V | tail -1 | grep -oE 'V[0-9]+' || echo "없음")
echo "📌 로컬 최신 마이그레이션: $LATEST_LOCAL"

# 3. 변경 사항 유무
CHANGES=$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
  echo "⚠ 커밋되지 않은 변경 ${CHANGES}건 있음"
fi

# 4. 바이브코딩 핵심 리마인드
echo ""
echo "=== 바이브코딩 핵심 규칙 ==="
echo "1. 모든 단계 전환은 사용자 명시적 지시만"
echo "2. 실행계획에 명시된 작업만 수행"
echo "3. 문제 발견 시 진단과 수정을 분리"
echo "4. 커밋/푸시는 매번 사용자 지시 필요"
echo "5. 동일 기능/UI는 동일 코드로 처리"
echo "==========================="
