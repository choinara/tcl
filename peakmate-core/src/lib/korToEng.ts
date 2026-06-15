/**
 * 한글 문자열을 영문 QWERTY 키 위치로 변환한다.
 * 비한글 문자는 그대로 유지.
 * 로그인 아이디 입력 시 한/영 전환 실수를 자동 보정한다.
 */

// 초성 19개
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// 중성 21개
const JUNGSEONG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
// 종성 28개 (첫 번째는 종성 없음)
const JONGSEONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// 자모 → 영문 매핑
const JAMO_MAP: Record<string, string> = {
  // 자음
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
  'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
  'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v',
  'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
  // 쌍자음 (Shift)
  'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T',
  // 겹모음
  'ㅒ': 'O', 'ㅖ': 'P',
  // 겹받침
  'ㄳ': 'rt', 'ㄵ': 'sw', 'ㄶ': 'sg', 'ㄺ': 'fr', 'ㄻ': 'fa',
  'ㄼ': 'fq', 'ㄽ': 'ft', 'ㄾ': 'fx', 'ㄿ': 'fv', 'ㅀ': 'fg',
  'ㅄ': 'qt',
  // 겹모음 (조합)
  'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl', 'ㅝ': 'nj', 'ㅞ': 'np',
  'ㅟ': 'nl', 'ㅢ': 'ml',
};

function jamoToEng(jamo: string): string {
  return JAMO_MAP[jamo] ?? jamo;
}

export function korToEng(str: string): string {
  let result = '';

  for (const char of str) {
    const code = char.charCodeAt(0);

    // 완성형 한글 (가 ~ 힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;

      result += jamoToEng(CHOSEONG[cho]);
      result += jamoToEng(JUNGSEONG[jung]);
      if (jong > 0) {
        result += jamoToEng(JONGSEONG[jong]);
      }
    }
    // 단독 자모 (ㄱ~ㅎ, ㅏ~ㅣ)
    else if (JAMO_MAP[char]) {
      result += JAMO_MAP[char];
    }
    // 비한글 (영문, 숫자, 특수문자)
    else {
      result += char;
    }
  }

  return result;
}
