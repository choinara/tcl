#!/bin/bash
# 작업 완료 후처리 — 타입체크 + 빌드
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
WARNINGS=""

echo "=== 작업 완료 검증 ==="

# 1. 백엔드 컴파일
echo "🔨 백엔드 컴파일 검사..."
if [ -f "$PROJECT_DIR/backend/gradlew" ]; then
  cd "$PROJECT_DIR/backend"
  ./gradlew compileJava 2>&1 | tail -3
  cd "$PROJECT_DIR"
fi

# 2. 프론트엔드 타입체크
echo "🔨 프론트엔드 타입체크..."
if [ -f "$PROJECT_DIR/frontend/tsconfig.json" ]; then
  cd "$PROJECT_DIR/frontend"
  npx tsc --noEmit 2>&1 | tail -5
  TSC_EXIT=$?
  cd "$PROJECT_DIR"
  if [ $TSC_EXIT -ne 0 ]; then
    WARNINGS="${WARNINGS}\n❌ tsc --noEmit 에러 발생"
  fi
fi

# 3. 변경 파일 목록
echo ""
echo "📝 변경 파일 목록:"
git -C "$PROJECT_DIR" diff --name-only 2>/dev/null
git -C "$PROJECT_DIR" diff --cached --name-only 2>/dev/null
git -C "$PROJECT_DIR" ls-files --others --exclude-standard 2>/dev/null

# 4. 경고 출력
if [ -n "$WARNINGS" ]; then
  echo ""
  echo "=== 경고 ==="
  echo -e "$WARNINGS"
fi

echo "=== 검증 완료 ==="
