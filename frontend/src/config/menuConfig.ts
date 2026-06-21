import type { MenuConfig, MenuGroup } from '@/components/layout/types';

const fb = (label: string) => ({ label, fallback: label });
const fbItem = (path: string, label: string) => ({ path, ...fb(label) });

const fallbackMenuStructure: MenuGroup[] = [
  { ...fb('대시보드'), icon: 'dashboard', path: '/' },
  {
    ...fb('이메일 자동화'), icon: 'mail',
    children: [
      fbItem('/email/dashboard', '이메일 대시보드'),
      fbItem('/email/search',    '이메일 검색'),
      fbItem('/email/accounts',  'IMAP 계정 설정'),
      fbItem('/email/rules',     '배정 룰 관리'),
    ],
  },
  {
    ...fb('운임·스케줄'), icon: 'ship',
    children: [
      fbItem('/freight/rates',     '운임 현황'),
      fbItem('/freight/schedules', '스케줄 현황'),
    ],
  },
  {
    ...fb('선적 트랙킹'), icon: 'mapPin',
    children: [
      fbItem('/tracking', '선적 트랙킹'),
    ],
  },
  {
    ...fb('AI 챗봇'), icon: 'bot',
    children: [
      fbItem('/chatbot', '업무 챗봇'),
    ],
  },
  {
    ...fb('어드민'), icon: 'sliders',
    children: [
      fbItem('/admin/tasks',     '과제 관리'),
      fbItem('/admin/scheduler', '스케줄러 현황'),
    ],
  },
  {
    ...fb('조직관리'), icon: 'building',
    children: [
      fbItem('/organization/department', '부서관리'),
      fbItem('/organization/company',    '회사관리'),
      fbItem('/organization/position',   '직급관리'),
      fbItem('/system/users',            '사용자관리'),
      fbItem('/organization/chart',      '조직도'),
    ],
  },
  {
    ...fb('시스템관리'), icon: 'settings',
    children: [
      fbItem('/system/menus',        '메뉴관리'),
      fbItem('/system/menu-auth',    '메뉴권한관리'),
      fbItem('/system/roles',        '역할관리'),
      fbItem('/system/settings',     '시스템설정'),
      fbItem('/system/user-auth',    '예외권한부여'),
      fbItem('/system/logs',         '시스템로그'),
      fbItem('/system/notification', '알림/게시판'),
      fbItem('/system/ui-settings',  'UI설정'),
      fbItem('/system/common-codes', '공통코드관리'),
      fbItem('/system/i18n',         '다국어관리'),
    ],
  },
];

const menuCodeToI18nKey: Record<string, string> = {
  ORGANIZATION: '조직관리',
  SYSTEM:       '시스템관리',
  EM:           '이메일 자동화',
  FR:           '운임·스케줄',
  TK:           '선적 트랙킹',
  CB:           'AI 챗봇',
  AD:           '어드민',
};

export const menuConfig: MenuConfig = {
  fallbackMenuStructure,
  menuCodeToI18nKey,
};
