#!/bin/bash
# UI 스크린샷 캡쳐 — Playwright로 메뉴 페이지를 캡쳐하고 체크리스트를 검증한다
# 사용법: capture-ui.sh {menuCode}
#
# 환경변수:
#   UI_CAPTURE_USER     로그인 아이디 (기본: admin)
#   UI_CAPTURE_PASS     로그인 비밀번호 (기본: admin)
#   CLAUDE_PROJECT_DIR  프로젝트 루트 (기본: 스크립트 위치 기준 상위 2단계)

MENU_CODE="${1:?'메뉴코드를 입력하세요 (예: capture-ui.sh AA0031)'}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
FRONTEND_DIR="$PROJECT_DIR/frontend"
OUTPUT_DIR="$HOME/Downloads/ui-screenshots/$MENU_CODE"

echo "=== UI 캡쳐 시작: $MENU_CODE ==="

# ── 사전 확인 ────────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  echo "ERROR: node가 설치되지 않았습니다." >&2; exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules/playwright" ]; then
  echo "ERROR: playwright 미설치. frontend/에서 npm install 실행하세요." >&2; exit 1
fi

# playwright 브라우저 바이너리 (chromium) 자동 설치
if ! node -e "require('playwright').chromium.executablePath()" &>/dev/null 2>&1; then
  echo "playwright chromium 바이너리 설치 중..."
  cd "$FRONTEND_DIR"
  npx playwright install chromium --with-deps 2>&1 | tail -3
  cd "$PROJECT_DIR"
fi

# ── 빈 포트 탐색 (6183 ~ 6192) ───────────────────────────────────────────────

find_free_port() {
  for p in $(seq 6183 6192); do
    if ! lsof -ti :"$p" &>/dev/null; then
      echo "$p"; return 0
    fi
  done
  return 1
}

ACTUAL_PORT=$(find_free_port)
if [ -z "$ACTUAL_PORT" ]; then
  echo "ERROR: 6183~6192 포트 모두 사용 중. 하나를 해제하세요." >&2; exit 1
fi

# ── vite dev 서버 시작 ────────────────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"
LOG_FILE="$OUTPUT_DIR/vite.log"

echo "포트 $ACTUAL_PORT: vite dev 서버 시작 중..."
cd "$FRONTEND_DIR"
npx vite --port "$ACTUAL_PORT" --mode dev >"$LOG_FILE" 2>&1 &
VITE_PID=$!
cd "$PROJECT_DIR"

# 서버 준비 대기 (최대 30초)
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$ACTUAL_PORT" 2>/dev/null || true)
  if [[ "$STATUS" =~ ^(200|301|302|304)$ ]]; then
    echo "서버 준비 완료 (${i}초, PID: $VITE_PID, 포트: $ACTUAL_PORT)"
    break
  fi
  sleep 1
done

# ── Playwright 캡쳐 실행 ──────────────────────────────────────────────────────

echo "스크린샷 캡쳐 중..."
CAPTURE_OUTPUT=$(
  CLAUDE_PROJECT_DIR="$PROJECT_DIR" \
  UI_CAPTURE_OUTPUT_DIR="$OUTPUT_DIR" \
  UI_CAPTURE_USER="${UI_CAPTURE_USER:-admin}" \
  UI_CAPTURE_PASS="${UI_CAPTURE_PASS:-admin}" \
  node "$SCRIPT_DIR/playwright-capture.mjs" "$MENU_CODE" "$ACTUAL_PORT" 2>&1
)
CAPTURE_EXIT=$?

# ── 실행한 포트의 서버 종료 ──────────────────────────────────────────────────

echo "vite dev 서버 종료 중 (PID: $VITE_PID, 포트: $ACTUAL_PORT)..."
kill "$VITE_PID" 2>/dev/null
wait "$VITE_PID" 2>/dev/null || true
echo "포트 $ACTUAL_PORT 종료 완료."

# ── 결과 출력 ─────────────────────────────────────────────────────────────────

echo "$CAPTURE_OUTPUT"
echo ""
echo "스크린샷 저장 위치: $OUTPUT_DIR"
echo "  → Finder로 열기: open \"$OUTPUT_DIR\""

if [ $CAPTURE_EXIT -ne 0 ]; then
  echo "ERROR: 캡쳐 실패 또는 체크리스트 FAIL (exit $CAPTURE_EXIT)" >&2
  exit $CAPTURE_EXIT
fi

echo "=== UI 캡쳐 완료 ==="
