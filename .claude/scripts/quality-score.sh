#!/bin/bash
# 코드 품질 점수 — 주요 위반 항목 카운트

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
FRONTEND_SRC="$PROJECT_DIR/frontend/src"
BACKEND_SRC="$PROJECT_DIR/backend/src/main/java"

echo "=== 코드 품질 점수 ==="

# 1. any 타입 사용
ANY_COUNT=$(grep -rn ': any' "$FRONTEND_SRC" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | wc -l | tr -d ' ')
echo "  any 타입: ${ANY_COUNT}건"

# 2. alert() 사용
ALERT_COUNT=$(grep -rn 'alert(' "$FRONTEND_SRC" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "confirmAppAlert" | grep -v "AlertDialog" | wc -l | tr -d ' ')
echo "  alert(): ${ALERT_COUNT}건"

# 3. catch 무시
CATCH_COUNT=$(grep -rn 'catch.*{}' "$FRONTEND_SRC" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
echo "  빈 catch: ${CATCH_COUNT}건"

# 4. console.error만 사용 (notify 없이)
CONSOLE_ONLY=$(grep -rn 'console\.error' "$FRONTEND_SRC" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "notify" | wc -l | tr -d ' ')
echo "  console.error만: ${CONSOLE_ONLY}건"

# 5. localStorage 사용
LS_COUNT=$(grep -rn 'localStorage\.' "$FRONTEND_SRC" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "usePreferenceStore" | wc -l | tr -d ' ')
echo "  localStorage: ${LS_COUNT}건"

# 6. usePermission ↔ @RequirePermission 불일치 검사
echo ""
echo "  [usePermission ↔ @RequirePermission 검사]"
FE_CODES=$(grep -rhoE "usePermission\('[A-Z]{2}[0-9]{4}'\)" "$FRONTEND_SRC" 2>/dev/null | grep -oE "'[A-Z]{2}[0-9]{4}'" | tr -d "'" | sort -u)
BE_CODES=$(grep -rhoE 'menu = "[A-Z]{2}[0-9]{4}"' "$BACKEND_SRC" 2>/dev/null | grep -oE '"[A-Z]{2}[0-9]{4}"' | tr -d '"' | sort -u)

FE_ONLY=$(comm -23 <(echo "$FE_CODES") <(echo "$BE_CODES") 2>/dev/null)
if [ -n "$FE_ONLY" ]; then
  echo "  ⚠ 프론트에만 있는 메뉴코드: $FE_ONLY"
fi

BE_ONLY=$(comm -13 <(echo "$FE_CODES") <(echo "$BE_CODES") 2>/dev/null)
if [ -n "$BE_ONLY" ]; then
  echo "  ℹ 백엔드에만 있는 메뉴코드: $BE_ONLY"
fi

echo "==========================="
