#!/bin/bash
# PreToolUse Hook — Bash 실행 전 검사
# 기존 hooks/block-yarn 통합 + pnpm 차단 + 커밋 전 검사
# Exit 0 = 허용(경고만), Exit 2 = 차단

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 1. yarn 명령 차단 (Rule 17: npm 통일)
if echo "$COMMAND" | grep -qE '^yarn\b|yarn add|yarn install|yarn run'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Rule 17: npm 통일. yarn 대신 npm을 사용하세요. (npm install, npm run <script>)"}}' >&2
  exit 2
fi

# 2. pnpm 명령 차단 (Rule 17: npm 통일)
if echo "$COMMAND" | grep -qE '^pnpm\b|pnpm add|pnpm install|pnpm run'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Rule 17: npm 통일. pnpm 대신 npm을 사용하세요. (npm install, npm run <script>)"}}' >&2
  exit 2
fi

# 3. git commit 시 추가 검사
if echo "$COMMAND" | grep -qE '^git commit'; then
  WARNINGS=""

  # 300줄 초과 변경 파일 감지
  LARGE_FILES=$(git diff --cached --stat 2>/dev/null | awk '{if ($3 > 300) print "  " $1, $3"줄"}')
  if [ -n "$LARGE_FILES" ]; then
    WARNINGS="${WARNINGS}\n[Rule 9] 300줄 초과 변경 파일:\n${LARGE_FILES}"
  fi

  # localStorage 사용 감지
  LS_FILES=$(git diff --cached --name-only -- '*.ts' '*.tsx' 2>/dev/null | xargs grep -l 'localStorage\.' 2>/dev/null | grep -v 'usePreferenceStore' | head -3)
  if [ -n "$LS_FILES" ]; then
    WARNINGS="${WARNINGS}\n[보안] localStorage 사용 감지 — HttpOnly 쿠키 사용 필요: ${LS_FILES}"
  fi

  if [ -n "$WARNINGS" ]; then
    echo -e "=== 커밋 전 검사 ===$WARNINGS"
  fi
fi

exit 0
