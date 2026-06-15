#!/bin/bash
# 변경 파일 중 300줄 초과 변경 검사

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

LARGE_FILES=$(git -C "$PROJECT_DIR" diff --cached --stat 2>/dev/null | awk '{if ($3 > 300) print "  ⚠ " $1 " — " $3 "줄 변경"}')

if [ -n "$LARGE_FILES" ]; then
  echo "=== 파일 크기 경고 ==="
  echo "300줄 초과 변경 파일:"
  echo "$LARGE_FILES"
  echo "Rule 9: 분리 검토 필요"
  echo "======================"
fi
