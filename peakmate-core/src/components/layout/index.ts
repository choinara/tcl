// Layout components
export { AppLayout } from './AppLayout';
export { SidebarMenuBase } from './SidebarMenuBase';
export { TabBar } from './TabBar';

// Types
export type { MenuConfig, MenuGroup, MenuItem, LucideIcon } from './types';

// Utilities
export {
  buildPathToI18nKey,
  resolveI18nLabel,
  convertToMenuGroups,
  getPageTitleFromStatic,
  getPageTitleFromDynamic,
} from './menuUtils';
