#!/bin/bash
# 메뉴 등록 8개 항목 자동 검증 (Rule 8-6)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
MENU_CODE=$1

if [ -z "$MENU_CODE" ]; then
  echo "사용법: verify-menu.sh <메뉴코드>"
  echo "예: verify-menu.sh MM0200"
  exit 1
fi

echo "=== 메뉴 등록 검증: $MENU_CODE ==="
PASS=0
FAIL=0

# 1. DB 메뉴 등록
DB_RESULT=$(docker exec peakmate-pg psql -U peakmate -d peakmate -t -c "SELECT use_yn FROM system_menu WHERE menu_code = '$MENU_CODE';" 2>/dev/null | tr -d ' ')
if [ "$DB_RESULT" = "Y" ]; then
  echo "✅ 1. DB 메뉴 등록 (use_yn='Y')"
  PASS=$((PASS + 1))
elif [ -z "$DB_RESULT" ]; then
  echo "❌ 1. DB 메뉴 미등록"
  FAIL=$((FAIL + 1))
else
  echo "⚠ 1. DB 메뉴 등록됨, use_yn='$DB_RESULT' (Y가 아님)"
  FAIL=$((FAIL + 1))
fi

# 2. DB 권한 등록
PERM_COUNT=$(docker exec peakmate-pg psql -U peakmate -d peakmate -t -c "SELECT COUNT(*) FROM menu_role_permission WHERE menu_id = (SELECT seq_id FROM system_menu WHERE menu_code = '$MENU_CODE');" 2>/dev/null | tr -d ' ')
if [ "${PERM_COUNT:-0}" -gt 0 ]; then
  echo "✅ 2. DB 권한 등록 (${PERM_COUNT}건)"
  PASS=$((PASS + 1))
else
  echo "❌ 2. DB 권한 미등록"
  FAIL=$((FAIL + 1))
fi

# 3. App.tsx (pathToMenuCode)
ROUTE=$(grep -c "$MENU_CODE" "$PROJECT_DIR/frontend/src/config/App.tsx (pathToMenuCode)" 2>/dev/null || echo "0")
if [ "$ROUTE" -gt 0 ]; then
  echo "✅ 3. App.tsx (pathToMenuCode) 등록"
  PASS=$((PASS + 1))
else
  echo "❌ 3. App.tsx (pathToMenuCode) 미등록"
  FAIL=$((FAIL + 1))
fi

# 4. menuConfig.ts (사이드바 폴백)
MENU_PATH=$(docker exec peakmate-pg psql -U peakmate -d peakmate -t -c "SELECT menu_path FROM system_menu WHERE menu_code = '$MENU_CODE';" 2>/dev/null | tr -d ' ')
if [ -n "$MENU_PATH" ]; then
  SIDEBAR=$(grep -c "$MENU_PATH" "$PROJECT_DIR/frontend/src/config/menuConfig.ts" 2>/dev/null || echo "0")
  if [ "$SIDEBAR" -gt 0 ]; then
    echo "✅ 4. menuConfig.ts 사이드바 폴백 등록"
    PASS=$((PASS + 1))
  else
    echo "❌ 4. menuConfig.ts 미등록 (경로: $MENU_PATH)"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⚠ 4. menuConfig.ts — DB에서 menu_path 조회 불가"
  FAIL=$((FAIL + 1))
fi

# 5. usePermission
FE_PERM=$(grep -rn "usePermission('$MENU_CODE')" "$PROJECT_DIR/frontend/src/domains/" 2>/dev/null | head -1)
if [ -n "$FE_PERM" ]; then
  echo "✅ 5. usePermission('$MENU_CODE') 적용"
  PASS=$((PASS + 1))
else
  echo "❌ 5. usePermission('$MENU_CODE') 미적용"
  FAIL=$((FAIL + 1))
fi

# 6. @RequirePermission (백엔드)
BE_PERM=$(grep -rn "@RequirePermission(menu = \"$MENU_CODE\"" "$PROJECT_DIR/backend/src/" 2>/dev/null | head -1)
if [ -n "$BE_PERM" ]; then
  echo "✅ 6. @RequirePermission(menu=\"$MENU_CODE\") 적용"
  PASS=$((PASS + 1))
else
  echo "❌ 6. @RequirePermission(menu=\"$MENU_CODE\") 미적용"
  FAIL=$((FAIL + 1))
fi

# 7. 페이지 컴포넌트 존재
PAGE_FILE=$(grep "$MENU_CODE" "$PROJECT_DIR/frontend/src/config/App.tsx (pathToMenuCode)" 2>/dev/null | grep -oE "import\('[^']+'\)" | tr -d "import()'")
if [ -n "$PAGE_FILE" ]; then
  RESOLVED=$(echo "$PAGE_FILE" | sed "s|@/|$PROJECT_DIR/frontend/src/|")
  if [ -f "${RESOLVED}.tsx" ] || [ -f "${RESOLVED}.ts" ] || [ -d "$RESOLVED" ]; then
    echo "✅ 7. 페이지 컴포넌트 존재"
    PASS=$((PASS + 1))
  else
    echo "❌ 7. 페이지 컴포넌트 미존재: $PAGE_FILE"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⚠ 7. 페이지 경로 파싱 불가"
  FAIL=$((FAIL + 1))
fi

# 8. usePermission ↔ @RequirePermission 코드 일치
if [ -n "$FE_PERM" ] && [ -n "$BE_PERM" ]; then
  echo "✅ 8. FE↔BE 메뉴코드 일치"
  PASS=$((PASS + 1))
else
  echo "⚠ 8. FE↔BE 비교 불가 (한쪽 미적용)"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== 결과: ${PASS}/8 통과, ${FAIL}건 실패 ==="
