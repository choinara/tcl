export const USER_MEMBER_FILTER_DEFAULTS = {
  keyword: '',
  status: '',
} as const;

export type UserMemberFilterValues = typeof USER_MEMBER_FILTER_DEFAULTS;

export const STATUS_CODES = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'LOCKED', label: '잠김' },
];
