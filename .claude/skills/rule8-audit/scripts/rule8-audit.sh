#!/usr/bin/env bash
# Rule 8-1 ~ 8-5 자동 검증 스크립트
# Usage: rule8-audit.sh [scope]
#   scope: all (default) | backend | frontend | {menuCode}

set -o pipefail

SCOPE="${1:-all}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend/src/main/java/com/peakmate/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/src"
CORE_DIR="$PROJECT_ROOT/peakmate-core/src"

# 색상 (옵션)
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
GREEN=$'\033[0;32m'
NC=$'\033[0m'

# 안전한 카운트 헬퍼: 입력의 라인 수를 반환 (빈 입력이면 0)
count_lines() {
  local input="$1"
  if [[ -z "$input" ]]; then
    echo 0
  else
    echo "$input" | grep -c . || echo 0
  fi
}

echo "═════════════════════════════════════════════════════════"
echo "  Rule 8-1~8-5 자동 검증 리포트"
echo "  scope: $SCOPE"
echo "  실행일: $(date '+%Y-%m-%d %H:%M')"
echo "═════════════════════════════════════════════════════════"
echo

# ─────────────────────────────────────────────────────────
# Rule 8-1: AuditableEntity 적용
# ─────────────────────────────────────────────────────────
echo "[Rule 8-1] AuditableEntity 적용"
echo "─────────────────────────────────────────────────────────"

if [[ "$SCOPE" == "all" || "$SCOPE" == "backend" ]]; then
  ENTITY_FILES=$(find "$BACKEND_DIR" -path "*/entity/*.java" -not -name "AuditableEntity.java" 2>/dev/null)
  ENTITY_COUNT=$(count_lines "$ENTITY_FILES")
  echo "검사 대상: ${ENTITY_COUNT}개 엔티티 파일"

  MISSING_AUDITABLE=0
  MISSING_FILES=""
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if grep -q "@Entity" "$file" 2>/dev/null; then
      if ! grep -q "extends AuditableEntity" "$file" 2>/dev/null; then
        MISSING_FILES+="  - ${file#$PROJECT_ROOT/}"$'\n'
        MISSING_AUDITABLE=$((MISSING_AUDITABLE + 1))
      fi
    fi
  done <<< "$ENTITY_FILES"

  MANUAL_TIMESTAMP=0
  TIMESTAMP_FILES=""
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if grep -qE "private\s+LocalDateTime\s+(createdAt|updatedAt)" "$file" 2>/dev/null; then
      TIMESTAMP_FILES+="  - ${file#$PROJECT_ROOT/}"$'\n'
      MANUAL_TIMESTAMP=$((MANUAL_TIMESTAMP + 1))
    fi
  done <<< "$ENTITY_FILES"

  if [[ $MISSING_AUDITABLE -gt 0 ]]; then
    echo "${RED}위반: extends AuditableEntity 누락 (${MISSING_AUDITABLE}건)${NC}"
    printf '%s' "$MISSING_FILES"
  fi

  if [[ $MANUAL_TIMESTAMP -gt 0 ]]; then
    echo "${RED}위반: createdAt/updatedAt 직접 선언 (${MANUAL_TIMESTAMP}건)${NC}"
    printf '%s' "$TIMESTAMP_FILES"
  fi

  TOTAL_8_1=$((MISSING_AUDITABLE + MANUAL_TIMESTAMP))
  if [[ $TOTAL_8_1 -eq 0 ]]; then
    echo "${GREEN}결과: PASS${NC}"
  else
    echo "${RED}결과: FAIL (위반 ${TOTAL_8_1}건)${NC}"
  fi
else
  echo "(skip — scope=$SCOPE)"
fi
echo

# ─────────────────────────────────────────────────────────
# Rule 8-2: 프론트엔드 에러 처리
# ─────────────────────────────────────────────────────────
echo "[Rule 8-2] 프론트엔드 에러 처리"
echo "─────────────────────────────────────────────────────────"

if [[ "$SCOPE" == "all" || "$SCOPE" == "frontend" ]]; then
  FE_TARGETS=()
  [[ -d "$FRONTEND_DIR" ]] && FE_TARGETS+=("$FRONTEND_DIR")
  [[ -d "$CORE_DIR" ]] && FE_TARGETS+=("$CORE_DIR")

  TOTAL_FILES=0
  for d in "${FE_TARGETS[@]}"; do
    n=$(find "$d" \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | wc -l | tr -d ' ')
    TOTAL_FILES=$((TOTAL_FILES + n))
  done
  echo "검사 대상: ${TOTAL_FILES}개 .ts/.tsx 파일"

  # alert() 사용 (coreNotify, 주석, 테스트 제외)
  ALERT_HITS=$(grep -rn "alert(" "${FE_TARGETS[@]}" \
    --include="*.tsx" --include="*.ts" 2>/dev/null \
    | grep -vE "(coreNotify|//.*alert|/\*.*alert|noAlert|spec\.tsx?|test\.tsx?)" || true)
  ALERT_COUNT=$(count_lines "$ALERT_HITS")

  # confirm() / window.confirm()
  CONFIRM_HITS=$(grep -rnE "(^|[^a-zA-Z_])(confirm\(|window\.confirm\()" "${FE_TARGETS[@]}" \
    --include="*.tsx" --include="*.ts" 2>/dev/null \
    | grep -vE "(useConfirm|confirmDialog|confirmText|spec\.tsx?|test\.tsx?)" || true)
  CONFIRM_COUNT=$(count_lines "$CONFIRM_HITS")

  # 빈 catch 블록 (주석 없음 또는 "ignore"/"무시"/"silently" 키워드만 위반)
  # CLAUDE.md 규칙: "실패 — [폴백 전략]" 형식의 주석은 허용
  CATCH_IGNORE_ALL=$(grep -rnE "catch\s*(\([^)]*\))?\s*\{\s*(/\*[^*]*\*/)?\s*\}" "${FE_TARGETS[@]}" \
    --include="*.tsx" --include="*.ts" 2>/dev/null || true)
  # 위 결과 중 "ignore"/"무시"/"silently"가 포함되거나, 주석 자체가 없는 빈 catch만 추출
  CATCH_IGNORE=$(echo "$CATCH_IGNORE_ALL" \
    | grep -E "(catch\s*(\([^)]*\))?\s*\{\s*\}|ignore|무시|silently)" || true)
  CATCH_IGNORE_COUNT=$(count_lines "$CATCH_IGNORE")

  # .catch(() => null) / .catch(() => {})
  CATCH_NULL=$(grep -rnE "\.catch\(\(\s*\)\s*=>\s*(null|\{\s*\})\s*\)" "${FE_TARGETS[@]}" \
    --include="*.tsx" --include="*.ts" 2>/dev/null || true)
  CATCH_NULL_COUNT=$(count_lines "$CATCH_NULL")

  # peakmate-core 내부 @/shared/ import
  SHARED_IMPORT=""
  if [[ -d "$CORE_DIR" ]]; then
    SHARED_IMPORT=$(grep -rn "from ['\"]@/shared/" "$CORE_DIR" \
      --include="*.tsx" --include="*.ts" 2>/dev/null || true)
  fi
  SHARED_IMPORT_COUNT=$(count_lines "$SHARED_IMPORT")

  if [[ $ALERT_COUNT -gt 0 ]]; then
    echo "${RED}- alert() 사용: ${ALERT_COUNT}건${NC}"
    echo "$ALERT_HITS" | head -10 | sed 's/^/    /'
    [[ $ALERT_COUNT -gt 10 ]] && echo "    ... (총 ${ALERT_COUNT}건)"
  fi
  if [[ $CONFIRM_COUNT -gt 0 ]]; then
    echo "${RED}- confirm()/window.confirm() 사용: ${CONFIRM_COUNT}건${NC}"
    echo "$CONFIRM_HITS" | head -10 | sed 's/^/    /'
  fi
  if [[ $CATCH_IGNORE_COUNT -gt 0 ]]; then
    echo "${RED}- catch ignore (빈 catch): ${CATCH_IGNORE_COUNT}건${NC}"
    echo "$CATCH_IGNORE" | head -10 | sed 's/^/    /'
  fi
  if [[ $CATCH_NULL_COUNT -gt 0 ]]; then
    echo "${YELLOW}- .catch(() => null/{}): ${CATCH_NULL_COUNT}건 (의도적 fire-and-forget인지 확인)${NC}"
    echo "$CATCH_NULL" | head -5 | sed 's/^/    /'
  fi
  if [[ $SHARED_IMPORT_COUNT -gt 0 ]]; then
    echo "${RED}- peakmate-core에서 @/shared/ import: ${SHARED_IMPORT_COUNT}건${NC}"
    echo "$SHARED_IMPORT" | head -5 | sed 's/^/    /'
  fi

  TOTAL_8_2=$((ALERT_COUNT + CONFIRM_COUNT + CATCH_IGNORE_COUNT + SHARED_IMPORT_COUNT))
  if [[ $TOTAL_8_2 -eq 0 && $CATCH_NULL_COUNT -eq 0 ]]; then
    echo "${GREEN}결과: PASS${NC}"
  elif [[ $TOTAL_8_2 -eq 0 ]]; then
    echo "${YELLOW}결과: WARN (확인 필요 ${CATCH_NULL_COUNT}건)${NC}"
  else
    echo "${RED}결과: FAIL (위반 ${TOTAL_8_2}건)${NC}"
  fi
else
  echo "(skip — scope=$SCOPE)"
fi
echo

# ─────────────────────────────────────────────────────────
# Rule 8-3: 시스템 로그 기록
# ─────────────────────────────────────────────────────────
echo "[Rule 8-3] 시스템 로그 기록 (CUD 메서드 SystemLog 누락 의심)"
echo "─────────────────────────────────────────────────────────"

if [[ "$SCOPE" == "all" || "$SCOPE" == "backend" ]]; then
  CTRL_FILES=$(find "$BACKEND_DIR" -path "*/controller/*.java" 2>/dev/null)
  CTRL_COUNT=$(count_lines "$CTRL_FILES")
  echo "검사 대상: ${CTRL_COUNT}개 Controller 파일"

  MISSING_LOG=0
  MISSING_OUTPUT=""
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    cud_count=$(grep -cE "(@PostMapping|@PutMapping|@DeleteMapping|@PatchMapping)" "$file" 2>/dev/null)
    cud_count=${cud_count:-0}
    log_count=$(grep -c "systemLogService\." "$file" 2>/dev/null)
    log_count=${log_count:-0}
    if [[ "$cud_count" -gt 0 && "$log_count" -eq 0 ]]; then
      MISSING_OUTPUT+="  - ${file#$PROJECT_ROOT/} (CUD ${cud_count}건 / log 0)"$'\n'
      MISSING_LOG=$((MISSING_LOG + 1))
    fi
  done <<< "$CTRL_FILES"

  if [[ $MISSING_LOG -gt 0 ]]; then
    echo "${YELLOW}SystemLogService 미사용 의심: ${MISSING_LOG}건${NC}"
    printf '%s' "$MISSING_OUTPUT"
    echo "${YELLOW}결과: WARN (의도적 미기록 가능성 — 수동 검토 필요)${NC}"
  else
    echo "${GREEN}결과: PASS${NC}"
  fi
else
  echo "(skip — scope=$SCOPE)"
fi
echo

# ─────────────────────────────────────────────────────────
# Rule 8-4: 기준정보 코드 중복검증
# ─────────────────────────────────────────────────────────
echo "[Rule 8-4] 기준정보 코드 중복검증"
echo "─────────────────────────────────────────────────────────"

if [[ "$SCOPE" == "all" || "$SCOPE" == "backend" ]]; then
  MASTER_CTRL=$(find "$BACKEND_DIR/interfaces/master/controller" -name "*Controller.java" 2>/dev/null)
  MASTER_COUNT=$(count_lines "$MASTER_CTRL")
  echo "검사 대상: ${MASTER_COUNT}개 Master Controller"

  MISSING_DUP_CHECK=0
  MISSING_DUP_OUTPUT=""
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if grep -q 'case "created"' "$file" 2>/dev/null; then
      if ! grep -qE "(findBy[A-Z][a-zA-Z]*Code|existsBy[A-Z][a-zA-Z]*Code)" "$file" 2>/dev/null; then
        MISSING_DUP_OUTPUT+="  - ${file#$PROJECT_ROOT/}"$'\n'
        MISSING_DUP_CHECK=$((MISSING_DUP_CHECK + 1))
      fi
    fi
  done <<< "$MASTER_CTRL"

  if [[ $MISSING_DUP_CHECK -gt 0 ]]; then
    echo "${RED}batchSave 'created'에서 코드 중복검증 누락: ${MISSING_DUP_CHECK}건${NC}"
    printf '%s' "$MISSING_DUP_OUTPUT"
    echo "${RED}결과: FAIL${NC}"
  else
    echo "${GREEN}결과: PASS${NC}"
  fi
else
  echo "(skip — scope=$SCOPE)"
fi
echo

# ─────────────────────────────────────────────────────────
# Rule 8-5: 드롭다운 공통코드 관리
# ─────────────────────────────────────────────────────────
echo "[Rule 8-5] 드롭다운 공통코드 관리"
echo "─────────────────────────────────────────────────────────"

if [[ "$SCOPE" == "all" || "$SCOPE" == "frontend" ]]; then
  TSX_COUNT=$(find "$FRONTEND_DIR" -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  echo "검사 대상: ${TSX_COUNT}개 .tsx 파일"

  HARDCODED=$(grep -rn "cellEditorParams" "$FRONTEND_DIR" --include="*.tsx" -A 1 2>/dev/null \
    | grep -E "values:\s*\[" \
    | grep -vE "values:\s*\['Y',\s*'N'\]" \
    | grep -vE "values:\s*\['N',\s*'Y'\]" \
    | grep -vE "useCommonCodes|allCodes\[" \
    | grep -vE "\.map\(|\.\.\." || true)
  HARDCODED_COUNT=$(count_lines "$HARDCODED")

  if [[ $HARDCODED_COUNT -gt 0 ]]; then
    echo "${YELLOW}cellEditorParams values 하드코딩 의심: ${HARDCODED_COUNT}건${NC}"
    echo "$HARDCODED" | head -15 | sed 's/^/    /'
    [[ $HARDCODED_COUNT -gt 15 ]] && echo "    ... (총 ${HARDCODED_COUNT}건)"
    echo "${YELLOW}결과: WARN (수동 검토 필요 — Y/N 등은 정상)${NC}"
  else
    echo "${GREEN}결과: PASS${NC}"
  fi
else
  echo "(skip — scope=$SCOPE)"
fi
echo

# ─────────────────────────────────────────────────────────
# 종합
# ─────────────────────────────────────────────────────────
echo "═════════════════════════════════════════════════════════"
echo "  검증 완료. 위반 항목 발견 시 사용자에게 보고 후 수정 지시 대기."
echo "  (진단과 수정 분리 원칙)"
echo "═════════════════════════════════════════════════════════"
