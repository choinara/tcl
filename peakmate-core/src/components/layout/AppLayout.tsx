import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarMenuBase } from './SidebarMenuBase';
import { TabBar } from './TabBar';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useTabStore } from '@/stores/useTabStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore, type GlassConfig, DEFAULT_GLASS } from '@/stores/usePreferenceStore';
import type { MenuConfig } from './types';
import { buildPathToI18nKey, getPageTitleFromStatic, getPageTitleFromDynamic, getMenuCodeFromDynamic, findFirstAccessibleMenu } from './menuUtils';
import { coreNotify } from '@/stores/useNotifyStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { hexToGlassGradient } from '@/lib/glassUtils';

interface AppLayoutProps {
  menuConfig: MenuConfig;
}

export function AppLayout({ menuConfig }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ password: '', passwordConfirm: '', email: '', name: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const addTab = useTabStore((s) => s.addTab);
  const updateAllLabels = useTabStore((s) => s.updateAllLabels);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const justLoggedIn = useAuthStore((s) => s.justLoggedIn);
  const justInitialized = useAuthStore((s) => s.justInitialized);
  const storeMenus = useAuthStore((s) => s.menus);

  // ── SSE: 강제 로그아웃 이벤트 수신 (단기 티켓 기반) ──
  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const res = await fetch('/api/session/ticket', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const ticket = json.data?.ticket;
        if (!ticket || cancelled) return;

        eventSource = new EventSource(`/api/session/events?ticket=${encodeURIComponent(ticket)}`);

        eventSource.addEventListener('force-logout', (e: MessageEvent) => {
          eventSource?.close();
          coreNotify(e.data || '다른 기기에서 로그인하여 현재 세션이 종료됩니다.', { type: 'error', persistent: true });
          logout();
          navigate('/login?sessionExpired=true');
        });

        eventSource.onerror = () => {
          // 연결 끊김 시 자동 재연결 (브라우저 기본 동작)
        };
      } catch {
        // SSE 티켓 발급 실패 — SSE 없이 HTTP 요청으로 동작
      }
    };

    connect();

    return () => {
      cancelled = true;
      eventSource?.close();
    };
  }, [logout, navigate]);

  // 즐겨찾기 자동 로딩용
  const prefLoaded = usePreferenceStore((s) => s.loaded);

  // 글래스모피즘 설정 — raw string으로 읽어 useMemo로 파싱 (새 객체 생성 방지)
  const glassRaw = usePreferenceStore((s) => s.prefs['pm-glass'] ?? '');
  const glassConfig = useMemo<GlassConfig>(() => {
    if (glassRaw) {
      try { return { ...DEFAULT_GLASS, ...JSON.parse(glassRaw) }; } catch { /* 글래스 설정 파싱 실패 — 기본 설정으로 렌더링 */ }
    }
    // fallback: localStorage
    try {
      const saved = localStorage.getItem('pm-glass');
      if (saved) return { ...DEFAULT_GLASS, ...JSON.parse(saved) };
    } catch { /* 글래스 설정 로드 실패 — 기본 설정으로 렌더링 */ }
    return DEFAULT_GLASS;
  }, [glassRaw]);
  const sidebarGlass = glassConfig.sidebar !== 'none';

  const pathToI18nKey = useMemo(
    () => buildPathToI18nKey(menuConfig.fallbackMenuStructure, menuConfig.pathToI18nKeyExtensions),
    [menuConfig.fallbackMenuStructure, menuConfig.pathToI18nKeyExtensions],
  );

  useEffect(() => {
    // i18n 번역 우선 → DB 메뉴명 fallback → 정적 fallback
    const menuCode = getMenuCodeFromDynamic(location.pathname, storeMenus);
    const i18nMenuKey = menuCode ? `menu.${menuCode}` : '';
    const translated = i18nMenuKey ? t(i18nMenuKey, { defaultValue: '' }) : '';
    const dynamicLabel = getPageTitleFromDynamic(location.pathname, storeMenus);
    const i18nKey = pathToI18nKey[location.pathname];
    const label = translated
      || dynamicLabel
      || (i18nKey ? t(i18nKey) : '')
      || t(getPageTitleFromStatic(location.pathname, menuConfig.fallbackMenuStructure));

    addTab({ path: location.pathname, label });
  }, [location.pathname, addTab, storeMenus, t, pathToI18nKey, menuConfig.fallbackMenuStructure]);

  // 메뉴명 변경 시 열린 탭 전체 라벨 즉시 갱신
  useEffect(() => {
    if (!storeMenus.length) return;
    updateAllLabels((path) => {
      const menuCode = getMenuCodeFromDynamic(path, storeMenus);
      const i18nMenuKey = menuCode ? `menu.${menuCode}` : '';
      const translated = i18nMenuKey ? t(i18nMenuKey, { defaultValue: '' }) : '';
      if (translated) return translated;
      const dynamicLabel = getPageTitleFromDynamic(path, storeMenus);
      if (dynamicLabel) return dynamicLabel;
      const i18nKey = pathToI18nKey[path];
      return i18nKey ? t(i18nKey) : '';
    });
  }, [storeMenus, updateAllLabels, t, pathToI18nKey]);

  // Preference 로딩 후 사이드바 상태 동기화
  useEffect(() => {
    if (prefLoaded) {
      const collapsed = usePreferenceStore.getState().getSidebarCollapsed();
      setSidebarOpen(!collapsed);
    }
  }, [prefLoaded]);

  // 로그인 직후 또는 URL 직접 접근(initialize) 시: DB에서 탭 세션 복원
  useEffect(() => {
    if ((!justLoggedIn && !justInitialized) || !storeMenus.length) return;
    useAuthStore.setState({ justLoggedIn: false, justInitialized: false });

    const permissionMap = useAuthStore.getState().permissionMap;

    (async () => {
      await useTabStore.getState().hydrateFromServer();
      const { tabs, activePath } = useTabStore.getState();

      // 권한 재검증 — canRead 없는 탭 제거
      const filtered = tabs.filter(t => {
        const code = getMenuCodeFromDynamic(t.path, storeMenus);
        if (!code) return true; // 동적 라우트는 ProtectedRoute가 책임
        return permissionMap[code]?.canRead === true;
      });

      if (filtered.length === 0) {
        // 첫 권한 메뉴 자동 오픈
        const firstMenu = findFirstAccessibleMenu(storeMenus, permissionMap);
        if (firstMenu) {
          addTab({ path: firstMenu.path, label: firstMenu.label });
          navigate(firstMenu.path);
        }
      } else {
        useTabStore.setState({ tabs: filtered, activePath: activePath ?? filtered[0].path });
        if (activePath && filtered.some(t => t.path === activePath)) {
          navigate(activePath);
        } else {
          navigate(filtered[0].path);
        }
      }
    })();
  }, [justLoggedIn, justInitialized, storeMenus, addTab, navigate]);

  const openProfileModal = () => {
    setProfileForm({ password: '', passwordConfirm: '', email: user?.email ?? '', name: user?.name ?? '' });
    setProfileError('');
    setProfileModalOpen(true);
  };

  const handleProfileSave = async () => {
    if (profileForm.password && profileForm.password !== profileForm.passwordConfirm) {
      setProfileError(t('page.userManagement.passwordMismatch'));
      return;
    }
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      // 기존 유저 전체 정보 조회
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) throw new Error();
      const meJson = await meRes.json();
      const fullUser = meJson.data;

      const body: Record<string, unknown> = {
        name: profileForm.name,
        email: profileForm.email,
        roleId: fullUser.roleId ?? null,
        departmentId: fullUser.departmentId ?? null,
        positionId: fullUser.positionId ?? null,
        companyId: fullUser.companyId ?? null,
        partnerId: fullUser.partnerId ?? null,
        employeeNumber: fullUser.employeeNumber ?? '',
        userType: fullUser.userType ?? 'INTERNAL',
      };
      if (profileForm.password) {
        body.password = profileForm.password;
      }

      const res = await fetch(`/api/system/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        updateUser({ name: profileForm.name, email: profileForm.email });
        setProfileModalOpen(false);
        coreNotify(t('message.updateSuccess'), { type: 'success' });
      } else {
        const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        setProfileError(json?.message || t('message.saveFailed'));
      }
    } catch {
      setProfileError(t('message.saveFailed'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Skip Navigation */}
      <a href="#main-content" className="skip-nav">{t('app.skipToContent', '본문 바로가기')}</a>

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${sidebarOpen ? '' : 'collapsed'}${sidebarGlass ? ' glass-sidebar' : ''}`}
        style={sidebarGlass ? { background: hexToGlassGradient(glassConfig.sidebar) } : undefined}
        aria-label={t('app.sidebarTitle')}
      >
        <div className="sidebar-header">
          {sidebarOpen && <span className="sidebar-title">{t('app.sidebarTitle')}</span>}
          <button
            className="sidebar-toggle"
            onClick={() => {
              setSidebarOpen(prev => {
                const next = !prev;
                usePreferenceStore.getState().setSidebarCollapsed(!next);
                return next;
              });
            }}
            title={sidebarOpen ? t('app.sidebar.collapse') : t('app.sidebar.expand')}
          >
            {sidebarOpen ? '\u2039' : '\u203A'}
          </button>
        </div>
        <SidebarMenuBase collapsed={!sidebarOpen} menuConfig={menuConfig} />
      </aside>

      {/* Main Content */}
      <main className="app-main" id="main-content">
        <header className="app-header" role="banner" aria-label={t('app.header', '헤더')}>
          <TabBar />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="header-user"
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              onClick={openProfileModal}
              title={t('app.editProfile')}
            >
              {user ? `${user.name} (${user.username})` : ''}
            </button>
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              style={{
                padding: '4px 10px',
                fontSize: 'var(--font-size-sm)',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              {t('app.logout')}
            </button>
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>

      {/* 프로필 수정 모달 */}
      <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title={t('app.editProfile')} wide>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <FormField
            label={t('page.userManagement.password')}
            type="password"
            value={profileForm.password}
            onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder={t('page.userManagement.passwordEditPlaceholder')}
          />
          <FormField
            label={t('page.userManagement.passwordConfirm')}
            type="password"
            value={profileForm.passwordConfirm}
            onChange={(e) => setProfileForm(prev => ({ ...prev, passwordConfirm: e.target.value }))}
            placeholder={t('page.userManagement.passwordConfirmPlaceholder')}
            error={profileForm.password && profileForm.passwordConfirm && profileForm.password !== profileForm.passwordConfirm ? t('page.userManagement.passwordMismatch') : undefined}
          />
          <FormField
            label={t('page.userManagement.email')}
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('page.userManagement.emailPlaceholder')}
          />
          <FormField
            label={t('page.userManagement.name')}
            required
            value={profileForm.name}
            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('page.userManagement.namePlaceholder')}
          />
        </div>
        {profileForm.password && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280', margin: '4px 0 8px', lineHeight: 1.5 }}>
            {t('page.userManagement.passwordPolicy')}
          </p>
        )}
        {profileError && (
          <p style={{ color: '#ef4444', fontSize: 'var(--font-size-sm)', margin: '4px 0 8px' }}>{profileError}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setProfileModalOpen(false)}
            style={{ padding: '4px 12px', fontSize: 'var(--font-size-sm)', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="mes-btn mes-btn-save"
            style={{ padding: '4px 12px', fontSize: 'var(--font-size-sm)' }}
          >
            {profileSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
