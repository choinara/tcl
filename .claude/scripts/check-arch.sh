#!/bin/bash
# 아키텍처 규칙 검사 (grep 기반, Node.js 의존성 없음)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
WARNINGS=""

# 1. localStorage 사용 금지 (JWT 보안)
LOCAL_STORAGE=$(grep -rn "localStorage\." "$PROJECT_DIR/frontend/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "usePreferenceStore" | grep -v "// localStorage" || true)
if [ -n "$LOCAL_STORAGE" ]; then
  WARNINGS="${WARNINGS}\n⚠ localStorage 사용 감지 (JWT 보안 — HttpOnly 쿠키 사용 필요):\n${LOCAL_STORAGE}"
fi

# 2. alert() 사용 금지
ALERT_USAGE=$(grep -rn "alert(" "$PROJECT_DIR/frontend/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "confirmAppAlert" | grep -v "AlertDialog" || true)
if [ -n "$ALERT_USAGE" ]; then
  WARNINGS="${WARNINGS}\n⚠ alert() 사용 감지 — notify() 사용 필요:\n${ALERT_USAGE}"
fi

# 3. catch 무시 금지
CATCH_IGNORE=$(grep -rn "catch.*{}" "$PROJECT_DIR/frontend/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$CATCH_IGNORE" ]; then
  WARNINGS="${WARNINGS}\n⚠ 빈 catch 블록 감지 — 에러 처리 필요:\n${CATCH_IGNORE}"
fi

# 4. @Value 사용 금지 (백엔드)
AT_VALUE=$(grep -rn "@Value(" "$PROJECT_DIR/backend/src/" --include="*.java" 2>/dev/null | grep -v "test" || true)
if [ -n "$AT_VALUE" ]; then
  WARNINGS="${WARNINGS}\n⚠ @Value 사용 감지 — @ConfigurationProperties 사용 필요:\n${AT_VALUE}"
fi

if [ -n "$WARNINGS" ]; then
  echo "=== 아키텍처 규칙 검사 ==="
  echo -e "$WARNINGS"
  echo "=========================="
fi
