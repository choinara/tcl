const CSS_STORAGE_KEY = 'pm-css-vars';

export function applySavedCssVars() {
  try {
    const saved = localStorage.getItem(CSS_STORAGE_KEY);
    if (!saved) return;
    const vars: Record<string, string> = JSON.parse(saved);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      if (value) root.style.setProperty(key, value);
    }
  } catch {
    // JSON 파싱 실패 — 기본 CSS 변수로 렌더링
  }
}
