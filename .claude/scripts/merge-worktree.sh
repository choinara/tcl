#!/bin/bash
# 워크트리 브랜치를 메인 브랜치로 병합 + 워크트리 정리
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
WORKTREE_NAME=$1

if [ -z "$WORKTREE_NAME" ]; then
  echo "사용법: merge-worktree.sh <워크트리명>"
  exit 1
fi

WORKTREE_DIR="$PROJECT_DIR/.claude/worktrees/$WORKTREE_NAME"
BRANCH_NAME="worktree-$WORKTREE_NAME"
MAIN_BRANCH=$(git -C "$PROJECT_DIR" branch --show-current)

echo "=== 워크트리 병합 ==="
echo "  워크트리 브랜치: $BRANCH_NAME"
echo "  대상 브랜치: $MAIN_BRANCH"

# 1. 메인 브랜치에서 머지
git -C "$PROJECT_DIR" merge "$BRANCH_NAME" --no-ff -m "merge: $BRANCH_NAME → $MAIN_BRANCH"

MERGE_EXIT=$?
if [ $MERGE_EXIT -ne 0 ]; then
  echo "❌ 머지 충돌 발생. 수동 해결 필요."
  exit 1
fi

# 2. 워크트리 + 브랜치 정리
git -C "$PROJECT_DIR" worktree remove "$WORKTREE_DIR" 2>/dev/null || true
git -C "$PROJECT_DIR" branch -d "$BRANCH_NAME" 2>/dev/null || true

echo "✅ 병합 완료 + 워크트리 정리됨"
