import { create } from 'zustand';
import { loadTabSessionFromServer, saveTabSessionToServer } from '@/lib/tabSessionApi';
import { getMenuCodeFromDynamic } from '@/components/layout/menuUtils';
import { useAuthStore } from './useAuthStore';

export interface TabItem {
  path: string;
  label: string;
}

interface TabState {
  tabs: TabItem[];
  activePath: string;
  hydrated: boolean;

  addTab: (tab: TabItem) => void;
  addTabSilent: (tab: TabItem) => void;
  removeTab: (path: string) => string | null;
  setActive: (path: string) => void;
  closeOthers: (path: string) => void;
  closeAll: () => string;
  closeRight: (path: string) => void;
  closeLeft: (path: string) => void;
  moveTab: (fromPath: string, toPath: string) => void;
  updateAllLabels: (resolver: (path: string) => string) => void;
  hydrateFromServer: () => Promise<void>;
  hydrateFromSession: () => boolean;
  flushToServer: () => Promise<void>;
  resetForLogout: () => void;
}

const HOME_TAB: TabItem = { path: '/', label: 'Dashboard' };
const SESSION_KEY = 'mes-open-tabs';

function loadSession(): { tabs: TabItem[]; activePath: string } {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        return { tabs: parsed.tabs, activePath: parsed.activePath || parsed.tabs[0].path };
      }
    }
  } catch { /* 세션 복원 실패 — 홈 탭으로 초기화 */ }
  return { tabs: [HOME_TAB], activePath: '/' };
}

function saveSession(tabs: TabItem[], activePath: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ tabs, activePath }));
  } catch { /* 세션 저장 실패 — 다음 세션에서 홈 탭으로 시작 */ }
}

const initial = loadSession();

// debounced DB 동기화
let dbSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDbSync(state: { tabs: TabItem[]; activePath: string }) {
  if (dbSyncTimer) clearTimeout(dbSyncTimer);
  dbSyncTimer = setTimeout(() => {
    const menus = useAuthStore.getState().menus;
    saveTabSessionToServer(state.tabs, state.activePath, (path) => {
      const code = getMenuCodeFromDynamic(path, menus);
      return code || undefined;
    }).catch(() => {
      /* 실패 — 다음 변경 시 재시도. sessionStorage는 유지되므로 손실 없음 */
    });
    dbSyncTimer = null;
  }, 1000);
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: initial.tabs,
  activePath: initial.activePath,
  hydrated: false,

  addTab: (tab) =>
    set((state) => {
      // 1. 정확히 같은 path
      const exact = state.tabs.find((t) => t.path === tab.path);
      if (exact) {
        if (tab.label && exact.label !== tab.label) {
          return {
            tabs: state.tabs.map((t) => t.path === tab.path ? { ...t, label: tab.label } : t),
            activePath: tab.path,
          };
        }
        return { activePath: tab.path };
      }

      // 2. 서브페이지 감지 (path prefix 매칭)
      //    e.g. /song-selections <-> /song-selections/create
      const relatedIdx = state.tabs.findIndex((t) =>
        tab.path.startsWith(t.path + '/') || t.path.startsWith(tab.path + '/'),
      );
      if (relatedIdx !== -1) {
        const newTabs = [...state.tabs];
        newTabs[relatedIdx] = {
          path: tab.path,
          label: tab.label || state.tabs[relatedIdx].label,
        };
        return { tabs: newTabs, activePath: tab.path };
      }

      // 3. 새 탭 (label 없으면 생성 안함)
      if (!tab.label) return { activePath: tab.path };
      return { tabs: [...state.tabs, tab], activePath: tab.path };
    }),

  addTabSilent: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.path === tab.path);
      if (exists) return state;
      return { tabs: [...state.tabs, tab] };
    }),

  removeTab: (path) => {
    const state = get();
    if (state.tabs.length <= 1) return null;
    const idx = state.tabs.findIndex((t) => t.path === path);
    if (idx === -1) return null;
    const newTabs = state.tabs.filter((t) => t.path !== path);
    let nextActive = state.activePath;
    if (state.activePath === path) {
      const nextIdx = Math.min(idx, newTabs.length - 1);
      nextActive = newTabs[nextIdx].path;
    }
    set({ tabs: newTabs, activePath: nextActive });
    return state.activePath === path ? nextActive : null;
  },

  setActive: (path) => set({ activePath: path }),

  closeOthers: (path) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.path === path),
      activePath: path,
    })),

  closeAll: () => {
    set({ tabs: [HOME_TAB], activePath: '/' });
    return '/';
  },

  closeRight: (path) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.path === path);
      if (idx === -1) return state;
      const newTabs = state.tabs.slice(0, idx + 1);
      const activeStillExists = newTabs.find((t) => t.path === state.activePath);
      return {
        tabs: newTabs,
        activePath: activeStillExists ? state.activePath : path,
      };
    }),

  closeLeft: (path) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.path === path);
      if (idx <= 0) return state;
      const newTabs = state.tabs.slice(idx);
      const activeStillExists = newTabs.find((t) => t.path === state.activePath);
      return {
        tabs: newTabs,
        activePath: activeStillExists ? state.activePath : path,
      };
    }),

  moveTab: (fromPath, toPath) =>
    set((state) => {
      if (fromPath === toPath) return state;
      const fromIdx = state.tabs.findIndex((t) => t.path === fromPath);
      const toIdx = state.tabs.findIndex((t) => t.path === toPath);
      if (fromIdx === -1 || toIdx === -1) return state;
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIdx, 1);
      newTabs.splice(toIdx, 0, moved);
      return { tabs: newTabs };
    }),

  updateAllLabels: (resolver) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        const newLabel = resolver(tab.path);
        return newLabel ? { ...tab, label: newLabel } : tab;
      }),
    })),

  hydrateFromServer: async () => {
    const data = await loadTabSessionFromServer();
    if (data && data.tabs && data.tabs.length > 0) {
      const tabs: TabItem[] = data.tabs.map(t => ({
        path: t.path,
        label: t.label || t.path,
      }));
      set({
        tabs,
        activePath: data.activePath || tabs[0].path,
        hydrated: true,
      });
      saveSession(tabs, data.activePath || tabs[0].path);
    } else {
      set({ hydrated: true });
    }
  },

  hydrateFromSession: () => {
    const loaded = loadSession();
    if (loaded.tabs.length > 0 && loaded.tabs[0].path !== '/') {
      set({ tabs: loaded.tabs, activePath: loaded.activePath, hydrated: true });
      return true;
    }
    set({ hydrated: true });
    return false;
  },

  flushToServer: async () => {
    if (dbSyncTimer) {
      clearTimeout(dbSyncTimer);
      dbSyncTimer = null;
    }
    const { tabs, activePath } = get();
    const menus = useAuthStore.getState().menus;
    await saveTabSessionToServer(tabs, activePath, (path) => {
      const code = getMenuCodeFromDynamic(path, menus);
      return code || undefined;
    }).catch(() => { /* 저장 실패 — 로그아웃은 계속 진행 */ });
  },

  resetForLogout: () => {
    if (dbSyncTimer) {
      clearTimeout(dbSyncTimer);
      dbSyncTimer = null;
    }
    sessionStorage.removeItem(SESSION_KEY);
    set({ tabs: [HOME_TAB], activePath: '/', hydrated: false });
  },
}));

// 상태 변경 시 sessionStorage 자동 동기화 + debounced DB 동기화
useTabStore.subscribe((state) => {
  saveSession(state.tabs, state.activePath);
  if (state.hydrated && useAuthStore.getState().user !== null) {
    scheduleDbSync(state);
  }
});
