import { useState, useMemo, useCallback, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Factory,
  Settings,
  ShoppingCart,
  Package,
  Wrench,
  ShieldCheck,
  Archive,
  Calculator,
  Search,
  Building2,
  Stamp,
  Truck,
  Users,
  BarChart3,
  FileText,
  Bell,
  KeyRound,
  Globe,
  Layers,
  Clock,
  FlaskConical,
  Tag,
  Inbox,
  DollarSign,
  Link2,
  Monitor,
  Zap,
  Thermometer,
  Droplet,
  Recycle,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  type LucideProps,
} from 'lucide-react';
import type { MenuGroup, MenuConfig, LucideIcon } from './types';
import { convertToMenuGroups, buildPathToI18nKey } from './menuUtils';

/** Default icon map shared by all derived apps */
const defaultIconMap: Record<string, LucideIcon> = {
  'dashboard': LayoutDashboard,
  'calendar': CalendarDays,
  'clipboard': ClipboardList,
  'clipboard-list': ClipboardList,
  'factory': Factory,
  'settings': Settings,
  'shopping-cart': ShoppingCart,
  'package': Package,
  'wrench': Wrench,
  'shield-check': ShieldCheck,
  'archive': Archive,
  'calculator': Calculator,
  'search': Search,
  'building': Building2,
  'stamp': Stamp,
  'truck': Truck,
  'users': Users,
  'bar-chart': BarChart3,
  'file-text': FileText,
  'bell': Bell,
  'key': KeyRound,
  'globe': Globe,
  'layers': Layers,
  'clock': Clock,
  'flask': FlaskConical,
  'tag': Tag,
  'inbox': Inbox,
  'dollar': DollarSign,
  'link': Link2,
  'monitor': Monitor,
  'zap': Zap,
  'thermometer': Thermometer,
  'droplet': Droplet,
  'recycle': Recycle,
  'filter': SlidersHorizontal,
};

function SidebarIcon({
  name,
  size = 18,
  iconMap,
}: {
  name: string;
  size?: number;
  iconMap: Record<string, ComponentType<LucideProps>>;
}) {
  const Icon = iconMap[name];
  if (!Icon) return <FileText size={size} />;
  return <Icon size={size} />;
}

function isGroupActive(group: MenuGroup, pathname: string): boolean {
  if (group.path) return group.path === pathname;
  return group.children?.some(c => c.path === pathname) ?? false;
}

interface SidebarMenuBaseProps {
  collapsed?: boolean;
  menuConfig: MenuConfig;
}

export function SidebarMenuBase({ collapsed = false, menuConfig }: SidebarMenuBaseProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const storeMenus = useAuthStore((s) => s.menus);

  const mergedIconMap = useMemo(() => {
    if (!menuConfig.iconMapExtensions) return defaultIconMap;
    return { ...defaultIconMap, ...menuConfig.iconMapExtensions };
  }, [menuConfig.iconMapExtensions]);

  const pathToI18nKey = useMemo(
    () => buildPathToI18nKey(menuConfig.fallbackMenuStructure, menuConfig.pathToI18nKeyExtensions),
    [menuConfig.fallbackMenuStructure, menuConfig.pathToI18nKeyExtensions],
  );

  // 동적 메뉴가 있으면 변환, 없으면 폴백
  const menuStructure = useMemo(() => {
    if (storeMenus.length > 0) {
      return convertToMenuGroups(storeMenus, menuConfig.menuCodeToI18nKey, pathToI18nKey);
    }
    return menuConfig.fallbackMenuStructure;
  }, [storeMenus, menuConfig.menuCodeToI18nKey, menuConfig.fallbackMenuStructure, pathToI18nKey]);

  // Group open/close from preference store (select raw string to avoid new-object infinite loop)
  const menuGroupsRaw = usePreferenceStore((s) => s.prefs['pm-menu-groups'] ?? '');
  const savedGroupsState = useMemo<Record<string, boolean>>(() => {
    if (!menuGroupsRaw) return {};
    try { return JSON.parse(menuGroupsRaw); } catch { return {}; }
  }, [menuGroupsRaw]);

  const [localOpenGroups, setLocalOpenGroups] = useState<Record<string, boolean>>({});

  const openGroups = useMemo(() => {
    const merged: Record<string, boolean> = {};
    // Default: open groups that contain active page
    menuStructure.forEach(g => {
      const key = g.id || g.label;
      if (g.children && isGroupActive(g, location.pathname)) {
        merged[key] = true;
      }
    });
    // Overlay saved state
    for (const [k, v] of Object.entries(savedGroupsState)) {
      merged[k] = v as boolean;
    }
    // Overlay local state (for immediate UI response)
    for (const [k, v] of Object.entries(localOpenGroups)) {
      merged[k] = v;
    }
    return merged;
  }, [menuStructure, location.pathname, savedGroupsState, localOpenGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    const newVal = !(openGroups[groupId] ?? false);
    setLocalOpenGroups(prev => ({ ...prev, [groupId]: newVal }));
    usePreferenceStore.getState().toggleMenuGroup(groupId, newVal);
  }, [openGroups]);

  return (
    <nav className="sidebar-nav" role="menubar" aria-label="sidebar menu">
      {menuStructure.map(group => {
        const groupId = group.id || group.label;
        const hasActive = isGroupActive(group, location.pathname);

        // --- Collapsed mode: icon + hover flyout ---
        if (collapsed) {
          if (group.path && !group.children) {
            const isActive = location.pathname === group.path;
            return (
              <div key={groupId} className="sidebar-group collapsed">
                <Link
                  to={group.path}
                  className={`sidebar-icon-btn ${isActive ? 'active' : ''}`}
                  title={t(group.label, { defaultValue: group.fallback })}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <SidebarIcon name={group.icon} size={20} iconMap={mergedIconMap} />
                </Link>
                <div className="sidebar-flyout">
                  <Link to={group.path} className={`sidebar-flyout-link ${isActive ? 'active' : ''}`} role="menuitem" aria-current={isActive ? 'page' : undefined}>
                    {t(group.label, { defaultValue: group.fallback })}
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <div key={groupId} className="sidebar-group collapsed">
              <div className={`sidebar-icon-btn ${hasActive ? 'active' : ''}`} title={t(group.label, { defaultValue: group.fallback })}>
                <SidebarIcon name={group.icon} size={20} iconMap={mergedIconMap} />
              </div>
              <div className="sidebar-flyout">
                <div className="sidebar-flyout-title">{t(group.label, { defaultValue: group.fallback })}</div>
                {group.children?.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-flyout-link ${isActive ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {t(item.label, { defaultValue: item.fallback })}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }

        // --- Expanded mode ---
        if (group.path && !group.children) {
          const isActive = location.pathname === group.path;
          return (
            <Link
              key={groupId}
              to={group.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
            >
              <SidebarIcon name={group.icon} size={18} iconMap={mergedIconMap} />
              <span>{t(group.label, { defaultValue: group.fallback })}</span>
            </Link>
          );
        }

        const isOpen = openGroups[groupId] ?? false;

        return (
          <div key={groupId}>
            <button
              onClick={() => toggleGroup(groupId)}
              className={`sidebar-group-btn ${hasActive ? 'active' : ''}`}
              aria-expanded={isOpen}
            >
              <SidebarIcon name={group.icon} size={18} iconMap={mergedIconMap} />
              <span style={{ flex: 1 }}>{t(group.label, { defaultValue: group.fallback })}</span>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isOpen && group.children && (
              <div role="group">
                {group.children.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-child-link ${isActive ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {t(item.label, { defaultValue: item.fallback })}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
