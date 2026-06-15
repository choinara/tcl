#!/bin/bash
# 메뉴 등록 검증 — PeakMate 전용
# 사용법: verify-menu.sh MM0200

MENU_CODE=$1

if [ -z "$MENU_CODE" ]; then
  echo "사용법: verify-menu.sh [menuCode]"
  exit 1
fi

echo "=== 메뉴 등록 검증: ${MENU_CODE} ==="
PASS=0
TOTAL=8

# 1. DB system_menu 등록 + use_yn
DB_RESULT=$(docker exec -i peakmate-pg psql -U peakmate -d peakmate -t -c \
  "SELECT use_yn FROM system_menu WHERE menu_code = '${MENU_CODE}'" 2>/dev/null | tr -d ' ')
if [ "$DB_RESULT" = "Y" ]; then
  echo "1. DB system_menu:        PASS"
  PASS=$((PASS + 1))
else
  echo "1. DB system_menu:        FAIL (use_yn=${DB_RESULT:-미등록})"
fi

# 2. 권한 부여
PERM_COUNT=$(docker exec -i peakmate-pg psql -U peakmate -d peakmate -t -c \
  "SELECT COUNT(*) FROM menu_role_permission mrp
   JOIN system_menu sm ON sm.seq_id = mrp.menu_id
   JOIN admin_role ar ON ar.seq_id = mrp.admin_role_id
   WHERE sm.menu_code = '${MENU_CODE}'
   AND ar.role_code IN ('SUPER_ADMIN', 'ADMIN')" 2>/dev/null | tr -d ' ')
if [ "$PERM_COUNT" -ge 2 ] 2>/dev/null; then
  echo "2. 권한 부여:             PASS"
  PASS=$((PASS + 1))
else
  echo "2. 권한 부여:             FAIL (${PERM_COUNT:-0}개 역할)"
fi

# 3. 사이드바 (DB use_yn으로 간접 확인)
if [ "$DB_RESULT" = "Y" ]; then
  echo "3. 사이드바 표시:         PASS (use_yn=Y, 재로그인 필요)"
  PASS=$((PASS + 1))
else
  echo "3. 사이드바 표시:         FAIL"
fi

# 4. App.tsx Route
MENU_PATH=$(docker exec -i peakmate-pg psql -U peakmate -d peakmate -t -c \
  "SELECT menu_path FROM system_menu WHERE menu_code = '${MENU_CODE}'" 2>/dev/null | tr -d ' ')
if [ -n "$MENU_PATH" ] && grep -q "path=\"${MENU_PATH}\"" frontend/src/App.tsx 2>/dev/null; then
  echo "4. App.tsx Route:         PASS"
  PASS=$((PASS + 1))
else
  echo "4. App.tsx Route:         FAIL (path=${MENU_PATH:-없음})"
fi

# 5. pathToMenuCode
if grep -q "'${MENU_PATH}'.*'${MENU_CODE}'" frontend/src/App.tsx 2>/dev/null || \
   grep -q "\"${MENU_PATH}\".*\"${MENU_CODE}\"" frontend/src/App.tsx 2>/dev/null; then
  echo "5. pathToMenuCode:        PASS"
  PASS=$((PASS + 1))
else
  echo "5. pathToMenuCode:        FAIL"
fi

# 6. menuConfig fallback
if grep -q "${MENU_PATH}" frontend/src/config/menuConfig.ts 2>/dev/null; then
  echo "6. menuConfig fallback:   PASS"
  PASS=$((PASS + 1))
else
  echo "6. menuConfig fallback:   FAIL"
fi

# 7~8은 코드 패턴 검색이므로 에이전트가 직접 확인
echo "7. @RequirePermission:    (에이전트 직접 확인)"
echo "8. usePermission:         (에이전트 직접 확인)"

echo ""
echo "자동 검증: ${PASS}/6 통과 (7~8은 에이전트 직접 확인 필요)"
