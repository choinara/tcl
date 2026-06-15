#!/bin/bash
# 워크트리 정리
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
WORKTREE_NAME=$1

if [ -z "$WORKTREE_NAME" ]; then
  echo "사용법: cleanup-worktree.sh <워크트리명>"
  exit 1
fi

WORKTREE_DIR="$PROJECT_DIR/.claude/worktrees/$WORKTREE_NAME"
BRANCH_NAME="worktree-$WORKTREE_NAME"

if [ ! -d "$WORKTREE_DIR" ]; then
  echo "⚠ 워크트리가 존재하지 않습니다: $WORKTREE_DIR"
  exit 1
fi

# 변경 사항 확인
CHANGES=$(git -C "$WORKTREE_DIR" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
COMMITS=$(git -C "$PROJECT_DIR" log "$BRANCH_NAME" --not "$(git -C "$PROJECT_DIR" branch --show-current)" --oneline 2>/dev/null | wc -l | tr -d ' ')

echo "=== 워크트리 정리 ==="
echo "  이름: $WORKTREE_NAME"
echo "  미커밋 변경: ${CHANGES}건"
echo "  미머지 커밋: ${COMMITS}건"

if [ "$CHANGES" -gt 0 ] || [ "$COMMITS" -gt 0 ]; then
  echo "⚠ 변경/커밋이 있습니다. merge-worktree.sh로 먼저 병합하거나, 강제 정리 시 데이터 유실"
  echo "  강제 정리: git worktree remove --force $WORKTREE_DIR"
  exit 1
fi

# 변경 없으면 자동 정리
git -C "$PROJECT_DIR" worktree remove "$WORKTREE_DIR" 2>/dev/null
git -C "$PROJECT_DIR" branch -d "$BRANCH_NAME" 2>/dev/null || true

echo "✅ 워크트리 정리 완료 (변경 없음 → 자동 삭제)"
