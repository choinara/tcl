export const ROLE_FILTER_DEFAULTS = {
  keyword: '',
  useYn: '',
} as const;

export type RoleFilterValues = typeof ROLE_FILTER_DEFAULTS;

export const USE_YN_CODES = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];
