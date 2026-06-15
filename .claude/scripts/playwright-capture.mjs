/**
 * UI 스크린샷 캡쳐 + 자동 체크리스트 검증
 * 사용법: node playwright-capture.mjs {menuCode} [port]
 *
 * 환경변수:
 *   UI_CAPTURE_USER  로그인 아이디 (기본: admin)
 *   UI_CAPTURE_PASS  로그인 비밀번호
 *   CLAUDE_PROJECT_DIR  프로젝트 루트
 */

import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const menuCode = process.argv[2];
const port = process.argv[3] || '6182';
const baseUrl = `http://localhost:${port}`;
const outputDir = process.env.UI_CAPTURE_OUTPUT_DIR
  || `${process.env.HOME}/Downloads/ui-screenshots/${menuCode}`;

const projectDir = process.env.CLAUDE_PROJECT_DIR
  || path.resolve(fileURLToPath(import.meta.url), '../../..');
const appTsxPath = path.join(projectDir, 'frontend/src/App.tsx');

// App.tsx에서 pathToMenuCode 역매핑(menuCode → urlPath) 추출
function extractMenuPath(menuCodeTarget) {
  if (!fs.existsSync(appTsxPath)) {
    throw new Error(`App.tsx를 찾을 수 없습니다: ${appTsxPath}`);
  }
  const src = fs.readFileSync(appTsxPath, 'utf8');
  const block = src.match(/const pathToMenuCode[^=]*=\s*\{([\s\S]*?)\};/)?.[1] ?? '';
  for (const [, urlPath, code] of block.matchAll(/'([^']+)':\s*'([^']+)'/g)) {
    if (code === menuCodeTarget) return urlPath;
  }
  return null;
}

const menuPath = extractMenuPath(menuCode);
if (!menuPath) {
  console.error(
    `메뉴코드 '${menuCode}'에 해당하는 URL 경로를 App.tsx pathToMenuCode에서 찾을 수 없습니다.`,
  );
  process.exit(1);
}

const username = process.env.UI_CAPTURE_USER || 'admin';
const password = process.env.UI_CAPTURE_PASS || 'admin';

fs.mkdirSync(outputDir, { recursive: true });

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  // 로그인
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  }).catch(() => {
    // 로그인 실패 시에도 계속 진행하여 현재 상태 캡쳐
  });

  // 메뉴 페이지 이동
  await page.goto(`${baseUrl}${menuPath}`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(2_000); // 그리드 데이터 로딩 대기

  // 스크린샷 1: 전체 페이지
  const ss1 = `${outputDir}/01_full.png`;
  await page.screenshot({ path: ss1, fullPage: true });

  // 스크린샷 2: 1440x900 뷰포트
  const ss2 = `${outputDir}/02_viewport.png`;
  await page.screenshot({ path: ss2 });

  // 스크린샷 3: 모바일 뷰포트
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  const ss3 = `${outputDir}/03_mobile.png`;
  await page.screenshot({ path: ss3 });

  // 자동 체크리스트 검증
  await page.setViewportSize({ width: 1440, height: 900 });

  const checks = await page.evaluate(() => {
    const bodyText = document.body.innerText ?? '';

    return {
      // PageTitle 컴포넌트: data-menu-code 속성 또는 .page-title 클래스 존재
      pageTitle:
        document.querySelectorAll('[data-menu-code], .page-title').length > 0,

      // 공통 버튼 스타일: mes-btn 계열 클래스 사용
      mesBtn:
        document.querySelectorAll(
          '.mes-btn, .mes-btn-save, .mes-btn-delete, [class*="mes-btn"]',
        ).length > 0,

      // AG Grid 헤더 렌더링 여부
      agGridHeader: document.querySelectorAll('.ag-header-cell').length > 0,

      // 번역키 미노출: page./common./message. 접두사가 그대로 보이면 번역 누락
      noRawTranslationKey:
        !/(page\.[a-z]+\.[a-zA-Z_]+|common\.[a-z]+\.[a-zA-Z_]+)/.test(bodyText),

      // 가로 스크롤 없음 (scrollWidth ≤ viewport + 20px 허용)
      noHorizontalScroll:
        document.documentElement.scrollWidth <= window.innerWidth + 20,

      // 콘솔 에러가 0건이면 이상적이나, 비율이 낮을 경우 WARNING으로만 처리
    };
  });

  await browser.close();

  const result = {
    menuCode,
    menuPath,
    outputDir,
    screenshots: [ss1, ss2, ss3],
    checklist: {
      pageTitle: { pass: checks.pageTitle, label: 'PageTitle 컴포넌트 렌더링' },
      mesBtn: { pass: checks.mesBtn, label: '공통 버튼 스타일(mes-btn)' },
      agGridHeader: { pass: checks.agGridHeader, label: 'AG Grid 헤더 표시' },
      noRawTranslationKey: {
        pass: checks.noRawTranslationKey,
        label: '번역키 미노출 (한국어 정상 표시)',
      },
      noHorizontalScroll: {
        pass: checks.noHorizontalScroll,
        label: '가로 스크롤 없음',
      },
    },
    consoleErrors: consoleErrors.slice(0, 5),
    timestamp: new Date().toISOString(),
  };

  // 체크리스트 요약 출력
  const fails = Object.values(result.checklist).filter((c) => !c.pass);
  console.log('\n--- 자동 체크리스트 결과 ---');
  for (const [key, check] of Object.entries(result.checklist)) {
    console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.label}`);
  }
  if (result.consoleErrors.length > 0) {
    console.log(`\nWARN 콘솔 에러 ${result.consoleErrors.length}건:`);
    result.consoleErrors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log('\n--- 스크린샷 경로 ---');
  result.screenshots.forEach((s) => console.log(`  ${s}`));
  console.log('\n[CAPTURE_RESULT_JSON]');
  console.log(JSON.stringify(result));

  if (fails.length > 0) {
    console.log(`\nFAIL 항목 ${fails.length}건 — 수정 후 재캡쳐 필요`);
    process.exit(2); // exit 2: 캡쳐 성공이나 체크리스트 실패
  }
}

capture().catch((err) => {
  console.error('캡쳐 오류:', err.message);
  process.exit(1);
});
