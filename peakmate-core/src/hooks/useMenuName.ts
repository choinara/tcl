import { useMemo } from 'react';
import { useAuthStore, type MenuTreeNode } from '@/stores/useAuthStore';

/**
 * menuCode로 DB의 menu_name을 조회하는 훅.
 * useAuthStore에 로드된 메뉴 트리에서 menuCode와 일치하는 메뉴명을 반환.
 * 메뉴관리에서 이름 변경 후 재로그인하면 자동 반영.
 */
export function useMenuName(menuCode: string, fallback?: string): string {
  const menus = useAuthStore((s) => s.menus);

  return useMemo(() => {
    if (!menus || menus.length === 0) return fallback ?? menuCode;

    function find(items: MenuTreeNode[]): string | null {
      for (const item of items) {
        if (item.menuCode === menuCode) return item.menuName;
        if (item.children?.length) {
          const found = find(item.children);
          if (found) return found;
        }
      }
      return null;
    }

    return find(menus) ?? fallback ?? menuCode;
  }, [menus, menuCode, fallback]);
}
