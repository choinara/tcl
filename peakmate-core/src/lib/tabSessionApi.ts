import { api } from './api';
import type { TabItem } from '@/stores/useTabStore';

interface TabItemDto {
  path: string;
  menuCode?: string;
  label?: string;
}

interface TabSessionResponse {
  tabs: TabItemDto[];
  activePath: string | null;
}

/**
 * 서버에서 탭 세션을 로드합니다.
 * 실패 시 null 반환 (sessionStorage/기본값으로 폴백).
 */
export async function loadTabSessionFromServer(): Promise<TabSessionResponse | null> {
  try {
    const res = await api.get<TabSessionResponse>('/auth/me/tab-session', undefined, { silent: true });
    return res.data;
  } catch {
    return null; /* 실패 — sessionStorage/기본값으로 폴백 */
  }
}

/**
 * 서버에 탭 세션을 저장합니다.
 * resolveMenuCode: path -> menuCode 변환 함수.
 */
export async function saveTabSessionToServer(
  tabs: TabItem[],
  activePath: string,
  resolveMenuCode: (path: string) => string | undefined
): Promise<void> {
  await api.put('/auth/me/tab-session', {
    tabs: tabs.map(t => ({
      path: t.path,
      menuCode: resolveMenuCode(t.path) || null,
      label: t.label,
    })),
    activePath,
  }, { silent: true });
}
