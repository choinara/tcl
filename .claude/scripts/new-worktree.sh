#!/bin/bash
# 워크트리 생성 자동화
set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
WORKTREE_NAME=$1

if [ -z "$WORKTREE_NAME" ]; then
  echo "사용법: new-worktree.sh <워크트리명>"
  echo "예: new-worktree.sh mm0080-impl"
  exit 1
fi

WORKTREE_DIR="$PROJECT_DIR/.claude/worktrees/$WORKTREE_NAME"
BRANCH_NAME="worktree-$WORKTREE_NAME"

# 이미 존재하면 안내
if [ -d "$WORKTREE_DIR" ]; then
  echo "⚠ 워크트리가 이미 존재합니다: $WORKTREE_DIR"
  echo "  기존 워크트리를 사용하거나 cleanup-worktree.sh로 정리 후 재생성"
  exit 1
fi

# 현재 브랜치 기준으로 워크트리 생성
CURRENT_BRANCH=$(git -C "$PROJECT_DIR" branch --show-current)
echo "=== 워크트리 생성 ==="
echo "  이름: $WORKTREE_NAME"
echo "  경로: $WORKTREE_DIR"
echo "  브랜치: $BRANCH_NAME (from $CURRENT_BRANCH)"

git -C "$PROJECT_DIR" worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME"

# 레지스트리 업데이트
REGISTRY="$PROJECT_DIR/.claude/scripts/worktree-registry.json"
if [ ! -f "$REGISTRY" ]; then
  echo '{"worktrees":[]}' > "$REGISTRY"
fi

# jq가 있으면 레지스트리에 추가
if command -v jq &>/dev/null; then
  ENTRY="{\"name\":\"$WORKTREE_NAME\",\"branch\":\"$BRANCH_NAME\",\"path\":\"$WORKTREE_DIR\",\"created\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
  jq ".worktrees += [$ENTRY]" "$REGISTRY" > "${REGISTRY}.tmp" && mv "${REGISTRY}.tmp" "$REGISTRY"
fi

echo "✅ 워크트리 생성 완료"
