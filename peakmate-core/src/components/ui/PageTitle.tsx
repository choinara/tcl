import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, type MenuTreeNode } from '@/stores/useAuthStore';
import { useMenuName } from '@/hooks/useMenuName';
import { MenuMemoButton } from '../memo/MenuMemoButton';

function findMenuCode(pathname: string, menus: MenuTreeNode[]): string {
  for (const node of menus) {
    if (node.menuPath === pathname) return node.menuCode;
    if (node.children?.length) {
      const found = findMenuCode(pathname, node.children);
      if (found) return found;
    }
  }
  return '';
}

/**
 * 페이지 타이틀 컴포넌트
 * i18n 번역키 우선 -> DB 메뉴명 fallback
 * 우측 느낌표 아이콘: 개발 메모 (DB 기반 MenuMemo)
 */
export function PageTitle({ i18nKey, label }: { i18nKey?: string; label?: string }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const menus = useAuthStore((s) => s.menus);

  const menuCode = useMemo(() => findMenuCode(pathname, menus), [pathname, menus]);
  const dbMenuName = useMenuName(menuCode);

  // 우선순위: label prop -> i18nKey 번역 -> 메뉴코드 i18n -> DB menuName
  const autoI18nKey = menuCode ? `menu.${menuCode}` : '';
  const key = i18nKey || autoI18nKey;
  const translated = key ? t(key, { defaultValue: '' }) : '';
  const title = label || translated || dbMenuName;

  return (
    <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {title}
      {menuCode && (
        <MenuMemoButton menuCode={menuCode} menuName={title} />
      )}
    </h2>
  );
}
