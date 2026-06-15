#!/usr/bin/env bash
# 공통 라이브러리(peakmate-core, peakmate-core-be) 변경 감지 스크립트
# Usage: core-change-check.sh [mode]
#   mode: staged (default) | unstaged | all | branch

set -o pipefail

MODE="${1:-staged}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# 색상
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
GREEN=$'\033[0;32m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'

echo "═════════════════════════════════════════════════════════"
echo "  공통 라이브러리 변경 검사"
echo "  mode: $MODE"
echo "  실행일: $(date '+%Y-%m-%d %H:%M')"
echo "═════════════════════════════════════════════════════════"
echo

# git 상태 가져오기
case "$MODE" in
  staged)
    CHANGES=$(git diff --name-status --cached 2>/dev/null)
    ;;
  unstaged)
    CHANGES=$(git diff --name-status 2>/dev/null)
    ;;
  all)
    STAGED=$(git diff --name-status --cached 2>/dev/null)
    UNSTAGED=$(git diff --name-status 2>/dev/null)
    UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | sed 's/^/A\t/')
    CHANGES=$(printf '%s\n%s\n%s\n' "$STAGED" "$UNSTAGED" "$UNTRACKED" | sort -u | grep -v '^$' || true)
    ;;
  branch)
    DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
    DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
    CHANGES=$(git diff --name-status "$DEFAULT_BRANCH"...HEAD 2>/dev/null)
    ;;
  *)
    echo "${RED}알 수 없는 mode: $MODE${NC}"
    echo "사용: $0 [staged|unstaged|all|branch]"
    exit 1
    ;;
esac

# peakmate-core 변경
CORE_CHANGES=$(echo "$CHANGES" | grep -E "(^|\s)peakmate-core/" 2>/dev/null || true)
CORE_CHANGES=$(echo "$CORE_CHANGES" | grep -v "peakmate-core-be/" 2>/dev/null || true)
CORE_COUNT=0
if [[ -n "$CORE_CHANGES" ]]; then
  CORE_COUNT=$(echo "$CORE_CHANGES" | grep -c . || echo 0)
fi

# peakmate-core-be 변경
CORE_BE_CHANGES=$(echo "$CHANGES" | grep "peakmate-core-be/" 2>/dev/null || true)
CORE_BE_COUNT=0
if [[ -n "$CORE_BE_CHANGES" ]]; then
  CORE_BE_COUNT=$(echo "$CORE_BE_CHANGES" | grep -c . || echo 0)
fi

TOTAL=$((CORE_COUNT + CORE_BE_COUNT))

if [[ $TOTAL -eq 0 ]]; then
  echo "${GREEN}peakmate-core: 변경 없음${NC}"
  echo "${GREEN}peakmate-core-be: 변경 없음${NC}"
  echo "─────────────────────────────────────────────────────────"
  echo "${GREEN}정상 진행 가능.${NC}"
  exit 0
fi

# 변경 발견 시
echo "${YELLOW}※ 공통 라이브러리 변경 감지 — 사전 보고 필요${NC}"
echo

if [[ $CORE_COUNT -gt 0 ]]; then
  echo "${CYAN}[peakmate-core 변경] ${CORE_COUNT}건${NC}"
  echo "$CORE_CHANGES" | sed 's/^/  /'
  echo
fi

if [[ $CORE_BE_COUNT -gt 0 ]]; then
  echo "${CYAN}[peakmate-core-be 변경] ${CORE_BE_COUNT}건${NC}"
  echo "$CORE_BE_CHANGES" | sed 's/^/  /'
  echo
fi

echo "─────────────────────────────────────────────────────────"
echo "${YELLOW}※ 공통 라이브러리는 전체 프로젝트에 영향을 미친다.${NC}"
echo "${YELLOW}※ 구현 전 사전 보고 + 사용자 승인 필수 (.claude/CLAUDE.md 규칙).${NC}"
echo "─────────────────────────────────────────────────────────"
echo
echo "[사전 보고 작성 템플릿]"
echo
if [[ $CORE_COUNT -gt 0 ]]; then
  cat <<'EOF'
```
[peakmate-core 변경 필요]

- 수정 대상: {컴포넌트/훅/클래스 이름}
- 현재 동작: {현재 어떻게 동작하는지 한 줄}
- 필요한 변경: {구체적으로 어떤 변경이 필요한지}
- 영향 범위: {기존 페이지/모듈에 미치는 영향 — grep으로 확인}
- 사유: {왜 이 변경이 필요한지 — 대안 검토 결과 포함}
```

EOF
fi

if [[ $CORE_BE_COUNT -gt 0 ]]; then
  cat <<'EOF'
```
[peakmate-core-be 변경 필요]

- 수정 대상: {클래스/패키지 이름}
- 현재 동작: {현재 어떻게 동작하는지 한 줄}
- 필요한 변경: {구체적으로 어떤 변경이 필요한지}
- 영향 범위: {기존 모듈/엔티티에 미치는 영향 — grep으로 확인}
- 사유: {왜 이 변경이 필요한지 — 대안 검토 결과 포함}
```

EOF
fi

echo "[영향 범위 확인 명령어 예시]"
echo
if [[ $CORE_COUNT -gt 0 ]]; then
  # 변경된 파일에서 export된 심볼 추출 시도
  FIRST_CORE_FILE=$(echo "$CORE_CHANGES" | head -1 | awk '{print $NF}')
  if [[ -n "$FIRST_CORE_FILE" ]]; then
    SYMBOL=$(basename "$FIRST_CORE_FILE" | sed -E 's/\.(tsx?|jsx?)$//')
    echo "  # 예: $SYMBOL 사용처 검색"
    echo "  grep -rn '$SYMBOL' frontend/src/"
    echo
  fi
fi

if [[ $CORE_BE_COUNT -gt 0 ]]; then
  FIRST_BE_FILE=$(echo "$CORE_BE_CHANGES" | head -1 | awk '{print $NF}')
  if [[ -n "$FIRST_BE_FILE" ]]; then
    SYMBOL=$(basename "$FIRST_BE_FILE" .java)
    echo "  # 예: $SYMBOL 사용처 검색"
    echo "  grep -rn '$SYMBOL' backend/src/"
    echo
  fi
fi

echo "─────────────────────────────────────────────────────────"
echo "${RED}승인 없이 변경한 경우 'git restore peakmate-core/ peakmate-core-be/' 로 되돌릴 것.${NC}"
echo "═════════════════════════════════════════════════════════"

# 변경이 있으면 exit 2 (사용자 승인 필요 신호)
exit 2
