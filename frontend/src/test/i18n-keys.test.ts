import { describe, it, expect } from 'vitest';
import ko from '../../../peakmate-core/src/locales/ko/translation.json';
import en from '../../../peakmate-core/src/locales/en/translation.json';

/** 중첩 JSON 객체의 모든 키를 dot-notation으로 추출 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n 번역 키 검증', () => {
  const koKeys = new Set(flattenKeys(ko));
  const enKeys = new Set(flattenKeys(en));

  it('ko에 있는 common.* 키가 en에도 있어야 한다', () => {
    const missing: string[] = [];
    for (const key of koKeys) {
      if (key.startsWith('common.') && !enKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `en에 누락된 common 키: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('ko에 있는 auth.* 키가 en에도 있어야 한다', () => {
    const missing: string[] = [];
    for (const key of koKeys) {
      if (key.startsWith('auth.') && !enKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `en에 누락된 auth 키: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('ko에 있는 message.* 키가 en에도 있어야 한다', () => {
    const missing: string[] = [];
    for (const key of koKeys) {
      if (key.startsWith('message.') && !enKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `en에 누락된 message 키: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('ko에 있는 error.* 키가 en에도 있어야 한다', () => {
    const missing: string[] = [];
    for (const key of koKeys) {
      if (key.startsWith('error.') && !enKeys.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `en에 누락된 error 키: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('en에 빈 문자열 번역이 없어야 한다', () => {
    const empty: string[] = [];
    const enFlat = flattenKeys(en);
    for (const key of enFlat) {
      const parts = key.split('.');
      let value: unknown = en;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      if (value === '') {
        empty.push(key);
      }
    }
    expect(empty, `en에 빈 번역: ${empty.slice(0, 10).join(', ')}...`).toHaveLength(0);
  });
});
