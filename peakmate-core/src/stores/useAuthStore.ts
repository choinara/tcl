import { create } from 'zustand';
import { usePreferenceStore } from './usePreferenceStore';
import { useTabStore } from './useTabStore';
import { startTokenRefreshTimer, stopTokenRefreshTimer } from '@/lib/api';
import { loadI18nOverrides } from '@/i18n';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  employeeNumber: string;
  roles: string[];
  enabled: boolean;
}

export interface MenuTreeNode {
  id: number;
  menuCode: string;
  menuName: string;
  menuPath: string;
  icon: string;
  sortOrder: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewPii: boolean;
  canApprove: boolean;
  children: MenuTreeNode[];
}

export interface PermissionSet {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewPii: boolean;
  canApprove: boolean;
}

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  justLoggedIn: boolean;
  justInitialized: boolean;
  menus: MenuTreeNode[];
  permissionMap: Record<string, PermissionSet>;

  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
  onTokenRefreshed: (user: AuthUser) => void;
  initialize: () => Promise<void>;
  fetchMenus: () => Promise<void>;
}

function buildPermissionMap(menus: MenuTreeNode[]): Record<string, PermissionSet> {
  const map: Record<string, PermissionSet> = {};

  function traverse(nodes: MenuTreeNode[]) {
    for (const node of nodes) {
      map[node.menuCode] = {
        canRead: node.canRead,
        canCreate: node.canCreate,
        canUpdate: node.canUpdate,
        canDelete: node.canDelete,
        canExport: node.canExport,
        canViewPii: node.canViewPii ?? false,
        canApprove: node.canApprove ?? false,
      };
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  }

  traverse(menus);
  return map;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  justLoggedIn: false,
  justInitialized: false,
  menus: [],
  permissionMap: {},

  login: (user) => {
    // 토큰은 서버가 HttpOnly 쿠키로 설정 — localStorage 저장 없음
    set({ user, initialized: true, justLoggedIn: true });
    get().fetchMenus();
    usePreferenceStore.getState().loadFromServer();
    startTokenRefreshTimer();
    loadI18nOverrides().catch(() => {}); // DB 번역 오버라이드 로드 — 실패 시 정적 JSON으로 동작
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },

  logout: async () => {
    // 1. 현재 탭을 DB에 즉시 저장 (쿠키 만료 전)
    await useTabStore.getState().flushToServer();
    // 2. 탭 스토어 초기화 (hydrated=false, dbSyncTimer 취소, sessionStorage 정리)
    useTabStore.getState().resetForLogout();
    // 3. 서버 로그아웃 (쿠키 클리어)
    stopTokenRefreshTimer();
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {}); // 서버 로그아웃 실패해도 클라이언트 상태는 이미 정리 완료
    usePreferenceStore.getState().clearPrefs();
    set({ user: null, initialized: true, menus: [], permissionMap: {} });
  },

  onTokenRefreshed: (user) => {
    // 토큰 갱신 성공 시 user 정보 업데이트 (토큰은 쿠키에 자동 설정됨)
    set({ user });
    startTokenRefreshTimer();
  },

  fetchMenus: async () => {
    try {
      const res = await fetch('/api/auth/me/menus', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const json = await res.json();
        const menus: MenuTreeNode[] = json.data ?? [];
        const permissionMap = buildPermissionMap(menus);
        set({ menus, permissionMap });
      }
    } catch {
      // 메뉴 로드 실패 — 빈 메뉴 상태로 폴백
    }
  },

  initialize: async () => {
    // 이미 초기화된 경우(login() 후 등) 재실행 방지
    if (get().initialized && get().user) return;

    try {
      // HttpOnly 쿠키가 자동 전송되어 서버에서 인증 확인
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        set({ user: json.data, initialized: true, justInitialized: true });
        get().fetchMenus();
        usePreferenceStore.getState().loadFromServer();
        startTokenRefreshTimer();
        loadI18nOverrides().catch(() => {}); // DB 번역 오버라이드 — 실패 시 정적 JSON으로 동작
      } else {
        // access token 만료 → refresh 시도 (refresh_token 쿠키 자동 전송)
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const data = refreshJson.data;
          set({ user: data.user, initialized: true, justInitialized: true });
          get().fetchMenus();
          usePreferenceStore.getState().loadFromServer();
          startTokenRefreshTimer();
          loadI18nOverrides().catch(() => {}); // DB 번역 오버라이드 — 실패 시 정적 JSON으로 동작
        } else {
          set({ user: null, initialized: true });
        }
      }
    } catch {
      set({ user: null, initialized: true });
    }
  },
}));
