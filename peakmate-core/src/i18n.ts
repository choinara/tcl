import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';
import zh from './locales/zh/translation.json';
import vi from './locales/vi/translation.json';
import id from './locales/id/translation.json';
import th from './locales/th/translation.json';

export const supportedLanguages = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', label: 'Bahasa', flag: '🇮🇩' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
      vi: { translation: vi },
      id: { translation: id },
      th: { translation: th },
    },
    fallbackLng: 'ko',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * 로그인 후 DB 기반 번역을 로드하여 정적 JSON을 오버라이드한다.
 * 로그인 페이지: 정적 JSON만 사용 (인증 불필요).
 * 로그인 후: DB 오버라이드 적용 (관리자가 수정한 번역이 반영됨).
 */
export async function loadI18nOverrides(): Promise<void> {
  try {
    const res = await fetch(`/api/system/i18n/messages/${i18n.language}`, { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    const overrides = json.data;
    if (overrides && typeof overrides === 'object' && Object.keys(overrides).length > 0) {
      const nested = unflattenObject(overrides);
      i18n.addResourceBundle(i18n.language, 'translation', nested, true, true);
    }
  } catch {
    // DB 오버라이드 로드 실패 — 정적 JSON으로 동작
  }
}

/** dot-notation 키를 중첩 객체로 변환 (예: "common.save" → { common: { save: "..." } }) */
function unflattenObject(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

export default i18n;
