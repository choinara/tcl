export const LOG_FILTER_DEFAULTS = {
  keyword: '',
  logType: '',
} as const;

export type LogFilterValues = typeof LOG_FILTER_DEFAULTS;

export const LOG_TYPE_CODES = [
  // 인증
  { value: 'LOGIN', label: '로그인' },
  { value: 'LOGOUT', label: '로그아웃' },
  { value: 'LOGIN_FAIL', label: '로그인실패' },
  { value: 'ACCOUNT_LOCK', label: '계정잠금' },
  { value: 'SESSION_FORCE_LOGOUT', label: '강제로그아웃' },
  // 비밀번호
  { value: 'PASSWORD_CHANGE', label: '비밀번호변경' },
  { value: 'PASSWORD_RESET', label: '비밀번호초기화' },
  // 사용자/권한
  { value: 'USER_CREATE', label: '사용자생성' },
  { value: 'USER_UPDATE', label: '사용자수정' },
  { value: 'USER_DELETE', label: '사용자삭제' },
  { value: 'ROLE_CHANGE', label: '역할변경' },
  { value: 'PERMISSION_CHANGE', label: '권한변경' },
  // 업무
  { value: 'APPROVAL', label: '승인' },
  { value: 'APPROVAL_CANCEL', label: '승인취소' },
  { value: 'DATA_IMPORT', label: '일괄저장' },
  // 기준정보
  { value: 'MASTER_CREATE', label: '기준정보' },
  // 시스템
  { value: 'SETTING_CHANGE', label: '설정변경' },
  { value: 'MENU_CHANGE', label: '메뉴변경' },
  { value: 'DORMANT', label: '휴면처리' },
  { value: 'RETENTION', label: '데이터보존' },
  // 에러
  { value: 'ERROR', label: '에러' },
  { value: 'SCHEDULER_ERROR', label: '스케줄러에러' },
];
