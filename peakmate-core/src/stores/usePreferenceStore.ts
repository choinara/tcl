import { create } from 'zustand';
import { api } from '@/lib/api';

import type { GridFeatureToggles } from '@/components/grid/types';
import { DEFAULT_GRID_FEATURES } from '@/components/grid/types';

const COL_ORDER_PREFIX = 'pm-col-order:';
const COL_WIDTH_PREFIX = 'pm-col-width:';
const COL_HIDDEN_PREFIX = 'pm-col-hidden:';
const CSS_VARS_KEY = 'pm-css-vars';
const FAVORITES_KEY = 'pm-favorites';
const GRID_FEATURES_KEY = 'pm-grid-features';
const GRID_PAGE_SIZE_KEY = 'pm-grid-page-size';
const WORKING_LABEL_KEY = 'pm-working-label';
const WORKING_LABEL_DEFAULT = "I'm working";
const MENU_GROUPS_KEY = 'pm-menu-groups';
const SIDEBAR_KEY = 'pm-sidebar-collapsed';
const GLASS_KEY = 'pm-glass';

export interface GlassConfig {
  sidebar: string; // 'none' | hex color
  login: string;   // 'none' | hex color
}

export const DEFAULT_GLASS: GlassConfig = { sidebar: 'none', login: 'none' };

export interface FavoriteItem {
  path: string;
  label: string;
}

interface PreferenceState {
  prefs: Record<string, string>;
  loaded: boolean;

  loadFromServer: () => Promise<void>;
  clearPrefs: () => void;

  getColOrder: (gridId: string) => string[] | null;
  setColOrder: (gridId: string, order: string[]) => void;
  removeColOrder: (gridId: string) => void;

  getColWidths: (gridId: string) => Record<string, number> | null;
  setColWidths: (gridId: string, widths: Record<string, number>) => void;
  removeColWidths: (gridId: string) => void;

  getColHidden: (gridId: string) => string[] | null;
  setColHidden: (gridId: string, hidden: string[]) => void;
  removeColHidden: (gridId: string) => void;

  getCssVars: () => Record<string, string>;
  setCssVars: (vars: Record<string, string>) => void;
  resetCssVars: () => void;

  getGridFeatures: () => GridFeatureToggles;
  setGridFeatures: (features: GridFeatureToggles) => void;
  resetGridFeatures: () => void;

  getFavorites: () => FavoriteItem[];
  addFavorite: (path: string, label: string) => boolean;
  removeFavorite: (path: string) => void;

  // Menu personalization
  getMenuGroupsState: () => Record<string, boolean>;
  toggleMenuGroup: (groupId: string, open: boolean) => void;

  getSidebarCollapsed: () => boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  getGlass: () => GlassConfig;
  setGlass: (config: GlassConfig) => void;

  /** 사용자가 선택한 그리드 페이지당 행 수. 미설정 시 null 반환 */
  getGridPageSize: () => number | null;
  setGridPageSize: (size: number) => void;

  /** 로딩 인디케이터 텍스트 (최대 20자). 미설정 시 기본값 반환 */
  getWorkingLabel: () => string;
  setWorkingLabel: (label: string) => void;
}

// Debounce timers per key
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function syncToServer(prefs: Record<string, string>) {
  api.put<Record<string, string>>('/auth/me/preferences', { preferences: prefs }, { silent: true }).catch(() => {}); // 설정 서버 동기화 — 실패 시 로컬 설정은 유지, 다음 변경 시 재시도
}

function debouncedSyncToServer(key: string, prefs: Record<string, string>) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    syncToServer({ [key]: prefs[key] });
    delete debounceTimers[key];
  }, 1000);
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  prefs: {},
  loaded: false,

  loadFromServer: async () => {
    try {
      const res = await api.get<Record<string, string>>('/auth/me/preferences');
      const serverPrefs = res.data ?? {};

      // Sync server prefs to localStorage
      for (const [key, value] of Object.entries(serverPrefs)) {
        if (key === CSS_VARS_KEY) {
          localStorage.setItem(CSS_VARS_KEY, value);
        } else if (key.startsWith(COL_ORDER_PREFIX) || key.startsWith(COL_WIDTH_PREFIX) || key.startsWith(COL_HIDDEN_PREFIX)) {
          localStorage.setItem(key, value);
        } else if (key === FAVORITES_KEY) {
          localStorage.setItem(FAVORITES_KEY, value);
        } else if (key === GRID_FEATURES_KEY) {
          localStorage.setItem(GRID_FEATURES_KEY, value);
        } else if (key === MENU_GROUPS_KEY || key === SIDEBAR_KEY || key === GLASS_KEY || key === GRID_PAGE_SIZE_KEY) {
          localStorage.setItem(key, value);
        }
      }

      // Apply CSS vars from server to DOM
      if (serverPrefs[CSS_VARS_KEY]) {
        try {
          const cssVars: Record<string, string> = JSON.parse(serverPrefs[CSS_VARS_KEY]);
          const root = document.documentElement;
          for (const [k, v] of Object.entries(cssVars)) {
            if (v) root.style.setProperty(k, v);
          }
        } catch { /* JSON 파싱 실패 — 서버 설정 또는 기본값으로 폴백 */ }
      }

      set({ prefs: serverPrefs, loaded: true });
    } catch {
      // Server unavailable — fall back to localStorage (loaded=true so grids don't block)
      set({ loaded: true });
    }
  },

  clearPrefs: () => {
    set({ prefs: {}, loaded: false });
  },

  getColOrder: (gridId: string) => {
    const key = `${COL_ORDER_PREFIX}${gridId}`;
    const { prefs, loaded } = get();

    // Prefer store value if loaded from server
    if (loaded && prefs[key]) {
      try { return JSON.parse(prefs[key]); } catch { /* fall through */ }
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    return null;
  },

  setColOrder: (gridId: string, order: string[]) => {
    const key = `${COL_ORDER_PREFIX}${gridId}`;
    const value = JSON.stringify(order);

    // localStorage immediately
    localStorage.setItem(key, value);

    // Store update
    set((state) => ({ prefs: { ...state.prefs, [key]: value } }));

    // Server debounced
    debouncedSyncToServer(key, { ...get().prefs, [key]: value });
  },

  removeColOrder: (gridId: string) => {
    const key = `${COL_ORDER_PREFIX}${gridId}`;

    localStorage.removeItem(key);

    const newPrefs = { ...get().prefs };
    delete newPrefs[key];
    set({ prefs: newPrefs });

    // Server: set empty string to indicate removal
    syncToServer({ [key]: '' });
  },

  getColWidths: (gridId: string) => {
    const key = `${COL_WIDTH_PREFIX}${gridId}`;

    // localStorage is always up-to-date (written synchronously in setColWidths)
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    // Fallback to store (server data)
    const { prefs, loaded } = get();
    if (loaded && prefs[key]) {
      try { return JSON.parse(prefs[key]); } catch { /* fall through */ }
    }

    return null;
  },

  setColWidths: (gridId: string, widths: Record<string, number>) => {
    const key = `${COL_WIDTH_PREFIX}${gridId}`;
    const value = JSON.stringify(widths);

    localStorage.setItem(key, value);
    // Skip Zustand set() to avoid re-render cascades in grid components
    // (prefs update → useGridFeatures/orderedColumns 재계산 → columnDefs 변경 → AG Grid 컬럼 폭 원복)
    // getColWidths() reads from localStorage first, so data is still accessible.
    debouncedSyncToServer(key, { [key]: value });
  },

  removeColWidths: (gridId: string) => {
    const key = `${COL_WIDTH_PREFIX}${gridId}`;

    localStorage.removeItem(key);

    const newPrefs = { ...get().prefs };
    delete newPrefs[key];
    set({ prefs: newPrefs });

    syncToServer({ [key]: '' });
  },

  getColHidden: (gridId: string) => {
    const key = `${COL_HIDDEN_PREFIX}${gridId}`;
    const { prefs, loaded } = get();

    if (loaded && prefs[key]) {
      try { return JSON.parse(prefs[key]); } catch { /* fall through */ }
    }

    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    return null;
  },

  setColHidden: (gridId: string, hidden: string[]) => {
    const key = `${COL_HIDDEN_PREFIX}${gridId}`;
    const value = JSON.stringify(hidden);

    localStorage.setItem(key, value);
    set((state) => ({ prefs: { ...state.prefs, [key]: value } }));
    debouncedSyncToServer(key, { ...get().prefs, [key]: value });
  },

  removeColHidden: (gridId: string) => {
    const key = `${COL_HIDDEN_PREFIX}${gridId}`;

    localStorage.removeItem(key);

    const newPrefs = { ...get().prefs };
    delete newPrefs[key];
    set({ prefs: newPrefs });

    syncToServer({ [key]: '' });
  },

  getCssVars: () => {
    const { prefs, loaded } = get();

    if (loaded && prefs[CSS_VARS_KEY]) {
      try { return JSON.parse(prefs[CSS_VARS_KEY]); } catch { /* fall through */ }
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(CSS_VARS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    return {};
  },

  setCssVars: (vars: Record<string, string>) => {
    const value = JSON.stringify(vars);

    localStorage.setItem(CSS_VARS_KEY, value);

    set((state) => ({ prefs: { ...state.prefs, [CSS_VARS_KEY]: value } }));

    // Server immediately (save button click)
    syncToServer({ [CSS_VARS_KEY]: value });
  },

  resetCssVars: () => {
    localStorage.removeItem(CSS_VARS_KEY);

    const newPrefs = { ...get().prefs };
    delete newPrefs[CSS_VARS_KEY];
    set({ prefs: newPrefs });

    syncToServer({ [CSS_VARS_KEY]: '' });
  },

  getFavorites: () => {
    const { prefs, loaded } = get();

    if (loaded && prefs[FAVORITES_KEY]) {
      try { return JSON.parse(prefs[FAVORITES_KEY]); } catch { /* fall through */ }
    }

    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    return [];
  },

  addFavorite: (path: string, label: string) => {
    const favorites = get().getFavorites();
    if (favorites.length >= 7) return false;
    if (favorites.some((f: FavoriteItem) => f.path === path)) return true;

    const newFavorites = [...favorites, { path, label }];
    const value = JSON.stringify(newFavorites);

    localStorage.setItem(FAVORITES_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [FAVORITES_KEY]: value } }));
    syncToServer({ [FAVORITES_KEY]: value });

    return true;
  },

  removeFavorite: (path: string) => {
    const favorites = get().getFavorites();
    const newFavorites = favorites.filter((f: FavoriteItem) => f.path !== path);
    const value = JSON.stringify(newFavorites);

    localStorage.setItem(FAVORITES_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [FAVORITES_KEY]: value } }));
    syncToServer({ [FAVORITES_KEY]: value });
  },

  getGridFeatures: () => {
    const migrate = (raw: Record<string, unknown>) => {
      // 기존 totalRow boolean → totalRowType 변환
      if ('totalRow' in raw) {
        raw.totalRowType = 'inline';
        delete raw.totalRow;
      }
      return raw;
    };

    const { prefs, loaded } = get();

    if (loaded && prefs[GRID_FEATURES_KEY]) {
      try { return { ...DEFAULT_GRID_FEATURES, ...migrate(JSON.parse(prefs[GRID_FEATURES_KEY])) } as GridFeatureToggles; } catch { /* fall through */ }
    }

    try {
      const saved = localStorage.getItem(GRID_FEATURES_KEY);
      if (saved) return { ...DEFAULT_GRID_FEATURES, ...migrate(JSON.parse(saved)) } as GridFeatureToggles;
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }

    return DEFAULT_GRID_FEATURES;
  },

  setGridFeatures: (features: GridFeatureToggles) => {
    const value = JSON.stringify(features);

    localStorage.setItem(GRID_FEATURES_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [GRID_FEATURES_KEY]: value } }));
    syncToServer({ [GRID_FEATURES_KEY]: value });
  },

  resetGridFeatures: () => {
    localStorage.removeItem(GRID_FEATURES_KEY);

    const newPrefs = { ...get().prefs };
    delete newPrefs[GRID_FEATURES_KEY];
    set({ prefs: newPrefs });

    syncToServer({ [GRID_FEATURES_KEY]: '' });
  },

  // =========================================================================
  // Menu personalization
  // =========================================================================

  getMenuGroupsState: () => {
    const { prefs, loaded } = get();
    if (loaded && prefs[MENU_GROUPS_KEY]) {
      try { return JSON.parse(prefs[MENU_GROUPS_KEY]); } catch { /* fall through */ }
    }
    try {
      const saved = localStorage.getItem(MENU_GROUPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }
    return {};
  },

  toggleMenuGroup: (groupId: string, open: boolean) => {
    const current = get().getMenuGroupsState();
    const updated = { ...current, [groupId]: open };
    const value = JSON.stringify(updated);
    localStorage.setItem(MENU_GROUPS_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [MENU_GROUPS_KEY]: value } }));
    debouncedSyncToServer(MENU_GROUPS_KEY, { ...get().prefs, [MENU_GROUPS_KEY]: value });
  },

  getSidebarCollapsed: () => {
    const { prefs, loaded } = get();
    if (loaded && prefs[SIDEBAR_KEY]) {
      try { return JSON.parse(prefs[SIDEBAR_KEY]); } catch { /* fall through */ }
    }
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }
    return false;
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    const value = JSON.stringify(collapsed);
    localStorage.setItem(SIDEBAR_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [SIDEBAR_KEY]: value } }));
    debouncedSyncToServer(SIDEBAR_KEY, { ...get().prefs, [SIDEBAR_KEY]: value });
  },

  getGlass: () => {
    const { prefs, loaded } = get();
    if (loaded && prefs[GLASS_KEY]) {
      try { return { ...DEFAULT_GLASS, ...JSON.parse(prefs[GLASS_KEY]) }; } catch { /* fall through */ }
    }
    try {
      const saved = localStorage.getItem(GLASS_KEY);
      if (saved) return { ...DEFAULT_GLASS, ...JSON.parse(saved) };
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }
    return DEFAULT_GLASS;
  },

  setGlass: (config: GlassConfig) => {
    const value = JSON.stringify(config);
    localStorage.setItem(GLASS_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [GLASS_KEY]: value } }));
    syncToServer({ [GLASS_KEY]: value });
  },

  getGridPageSize: () => {
    const { prefs, loaded } = get();
    if (loaded && prefs[GRID_PAGE_SIZE_KEY]) {
      const n = Number(prefs[GRID_PAGE_SIZE_KEY]);
      if (n > 0) return n;
    }
    try {
      const saved = localStorage.getItem(GRID_PAGE_SIZE_KEY);
      if (saved) {
        const n = Number(saved);
        if (n > 0) return n;
      }
    } catch { /* localStorage 접근 실패 — 기본값으로 폴백 */ }
    return null;
  },

  setGridPageSize: (size: number) => {
    const value = String(size);
    localStorage.setItem(GRID_PAGE_SIZE_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [GRID_PAGE_SIZE_KEY]: value } }));
    debouncedSyncToServer(GRID_PAGE_SIZE_KEY, { ...get().prefs, [GRID_PAGE_SIZE_KEY]: value });
  },

  getWorkingLabel: () => {
    const { prefs, loaded } = get();
    if (loaded && prefs[WORKING_LABEL_KEY]) return prefs[WORKING_LABEL_KEY];
    try {
      const saved = localStorage.getItem(WORKING_LABEL_KEY);
      if (saved) return saved;
    } catch { /* localStorage 접근 실패 — 기본값 사용 */ }
    return WORKING_LABEL_DEFAULT;
  },

  setWorkingLabel: (label: string) => {
    const value = label.trim() || WORKING_LABEL_DEFAULT;
    localStorage.setItem(WORKING_LABEL_KEY, value);
    set((state) => ({ prefs: { ...state.prefs, [WORKING_LABEL_KEY]: value } }));
    debouncedSyncToServer(WORKING_LABEL_KEY, { ...get().prefs, [WORKING_LABEL_KEY]: value });
  },
}));
