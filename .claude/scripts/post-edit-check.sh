#!/bin/bash
# PostToolUse Hook — Edit/Write 완료 후 코드 품질 검사
# 기존 hooks/detect-alert + detect-value-annotation + check-file-size 통합
# Exit 0 = 경고만, 차단 안 함

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# 파일이 존재하지 않으면 종료
[ -f "$FILE" ] || exit 0

WARNINGS=""

# 1. TypeScript/TSX 파일 검사
if [[ "$FILE" == *.ts || "$FILE" == *.tsx || "$FILE" == *.js || "$FILE" == *.jsx ]]; then
  # alert() 사용 감지 (Rule 8-2)
  if grep -q 'alert(' "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n[Rule 8-2] alert() 사용 감지 — coreNotify() 또는 notify()를 사용하세요."
  fi

  # any 타입 감지 (Rule 2)
  ANY_COUNT=$(grep -c ': any' "$FILE" 2>/dev/null || echo "0")
  if [ "$ANY_COUNT" -gt 0 ]; then
    WARNINGS="${WARNINGS}\n[Rule 2] any 타입 ${ANY_COUNT}건 감지 — 구체적인 타입을 사용하세요."
  fi

  # 빈 catch 블록 감지 (Rule 8-2)
  if grep -qE 'catch\s*\{?\s*\}' "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n[Rule 8-2] 빈 catch 블록 감지 — notify()로 에러 처리하세요."
  fi
fi

# 2. Java 파일 검사
if [[ "$FILE" == *.java ]]; then
  # @Value 사용 감지 (Rule 8-2)
  if grep -q '@Value(' "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n[Rule 8-2] @Value 사용 감지 — @ConfigurationProperties record 클래스를 사용하세요."
  fi
fi

# 3. 파일 크기 검사 (Rule 9) — 500줄 초과 시 경고
LINES=$(wc -l < "$FILE" | tr -d ' ')
if [ "$LINES" -gt 500 ]; then
  WARNINGS="${WARNINGS}\n[Rule 9] ${LINES}줄 — 300줄 초과 파일은 분리를 검토하세요."
fi

if [ -n "$WARNINGS" ]; then
  echo -e "=== 코드 품질 검사: $(basename "$FILE") ===$WARNINGS"
fi

exit 0
