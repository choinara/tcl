/** 날짜 모드 옵션 — DateModeRangeSearchBar에서 공통 사용 */
export const DATE_MODE_OPTIONS = ['일자선택', '기간선택'] as const;
export type DateMode = (typeof DATE_MODE_OPTIONS)[number];

/** 연도 선택 옵션 */
export const YEAR_OPTIONS = [2024, 2025, 2026, 2027] as const;

/** 월 이름 배열 */
export const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] as const;
