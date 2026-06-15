import type { MenuTreeNode, PermissionSet } from '@/stores/useAuthStore';
import type { MenuGroup } from './types';

/**
 * Build path -> i18n key mapping from fallbackMenuStructure + optional extensions.
 */
export function buildPathToI18nKey(
  fallbackMenuStructure: MenuGroup[],
  extensions?: Record<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of fallbackMenuStructure) {
    if (group.path) map[group.path] = group.label;
    if (group.children) {
      for (const child of group.children) {
        map[child.path] = child.label;
      }
    }
  }
  if (extensions) {
    Object.assign(map, extensions);
  }
  return map;
}

export interface ResolvedLabel {
  i18nKey: string;    // t()에 전달할 번역 키 (menu.{menuCode})
  fallback: string;   // 번역 없을 때 표시할 값 (DB menuName 등)
}

/**
 * Resolve i18n label for a DB menu node.
 * Returns { i18nKey, fallback } — 호출처에서 t(i18nKey, { defaultValue: fallback })로 사용.
 */
export function resolveI18nLabel(
  menuCode: string,
  menuPath: string | null,
  menuName: string,
  menuCodeToI18nKey: Record<string, string>,
  pathToI18nKey: Record<string, string>,
): ResolvedLabel {
  const i18nKey = `menu.${menuCode}`;
  // fallback 우선순위: DB menuName → menuCodeToI18nKey → pathToI18nKey → menuCode
  const fallback = menuName
    || menuCodeToI18nKey[menuCode]
    || (menuPath && pathToI18nKey[menuPath])
    || menuCode;
  return { i18nKey, fallback };
}

/**
 * Convert DB MenuTreeNode[] -> MenuGroup[] using i18n key resolution.
 */
export function convertToMenuGroups(
  nodes: MenuTreeNode[],
  menuCodeToI18nKey: Record<string, string>,
  pathToI18nKey: Record<string, string>,
): MenuGroup[] {
  return nodes.map(node => {
    const icon = node.icon || 'file-text';
    const resolved = resolveI18nLabel(node.menuCode, node.menuPath, node.menuName, menuCodeToI18nKey, pathToI18nKey);
    const id = node.menuCode;

    if (!node.children || node.children.length === 0) {
      return { id, label: resolved.i18nKey, fallback: resolved.fallback, icon, path: node.menuPath || '/' };
    }

    return {
      id,
      label: resolved.i18nKey,
      fallback: resolved.fallback,
      icon,
      children: node.children.map(child => {
        const childResolved = resolveI18nLabel(child.menuCode, child.menuPath, child.menuName, menuCodeToI18nKey, pathToI18nKey);
        return {
          id: child.menuCode,
          path: child.menuPath || '',
          label: childResolved.i18nKey,
          fallback: childResolved.fallback,
        };
      }),
    };
  });
}

/**
 * Find page title from static fallback menu structure.
 */
export function getPageTitleFromStatic(pathname: string, menuStructure: MenuGroup[]): string {
  for (const group of menuStructure) {
    if (group.path === pathname) return group.label;
    if (group.children) {
      const child = group.children.find(c => c.path === pathname);
      if (child) return child.label;
    }
  }
  return '';
}

/**
 * Find menuCode from dynamic DB menu tree (recursive).
 */
export function getMenuCodeFromDynamic(pathname: string, menus: MenuTreeNode[]): string {
  for (const node of menus) {
    if (node.menuPath === pathname) return node.menuCode;
    if (node.children?.length) {
      const found = getMenuCodeFromDynamic(pathname, node.children);
      if (found) return found;
    }
  }
  return '';
}

/**
 * Find page title from dynamic DB menu tree (recursive).
 */
export function getPageTitleFromDynamic(pathname: string, menus: MenuTreeNode[]): string {
  for (const node of menus) {
    if (node.menuPath === pathname) return node.menuName;
    if (node.children?.length) {
      const found = getPageTitleFromDynamic(pathname, node.children);
      if (found) return found;
    }
  }
  return '';
}

/**
 * 탭 세션 복원 시 첫 권한 메뉴를 찾는 함수.
 * MM(기준정보)/SM(시스템) 제외, canRead=true인 첫 리프 메뉴 반환.
 * BFS로 순회하며, 서버에서 sortOrder ASC로 정렬되어 온다고 가정.
 */
export interface AccessibleMenu {
  menuCode: string;
  path: string;
  label: string;
}

const EXCLUDED_PREFIXES = ['MM', 'SM'];

export function findFirstAccessibleMenu(
  menus: MenuTreeNode[],
  permissionMap: Record<string, PermissionSet>
): AccessibleMenu | null {
  const queue: MenuTreeNode[] = [...menus];
  while (queue.length > 0) {
    const node = queue.shift()!;
    const prefix = node.menuCode?.replace(/[0-9].*/, '');
    const isExcluded = EXCLUDED_PREFIXES.includes(prefix);
    const canRead = permissionMap[node.menuCode]?.canRead === true;

    if (!isExcluded && canRead && node.menuPath && node.menuPath !== '/') {
      return { menuCode: node.menuCode, path: node.menuPath, label: node.menuName };
    }
    if (node.children?.length) {
      queue.push(...node.children);
    }
  }
  return null;
}
