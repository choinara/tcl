import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export interface MenuItem {
  id?: string;   // menuCode (for personalization)
  path: string;
  label: string;
  fallback: string;  // 번역 없을 때 표시할 값 (DB menuName 등)
}

export interface MenuGroup {
  id?: string;    // menuCode (for personalization)
  label: string;
  fallback: string;  // 번역 없을 때 표시할 값 (DB menuName 등)
  icon: string;
  path?: string;
  children?: MenuItem[];
}

export type LucideIcon = ComponentType<LucideProps>;

/**
 * App-specific menu configuration.
 * Each derived project (peakmate, ...) provides its own MenuConfig.
 */
export interface MenuConfig {
  /** Hardcoded fallback menu (used when API returns no menus) */
  fallbackMenuStructure: MenuGroup[];
  /** DB menuCode -> i18n key mapping (top-level categories with null menuPath) */
  menuCodeToI18nKey: Record<string, string>;
  /** Additional path -> i18n key overrides not covered by fallbackMenuStructure */
  pathToI18nKeyExtensions?: Record<string, string>;
  /** Additional icon name -> LucideIcon component mappings */
  iconMapExtensions?: Record<string, LucideIcon>;
  /** menuPath -> page title i18n key mapping (e.g. '/master/products' -> 'page.product.title') */
  pathToPageTitleKey?: Record<string, string>;
}
