export interface SystemSettingsData {
  siteName?: string;
  siteDescription?: string;
  defaultLanguage?: string;
  timezone?: string;
  maintenanceMode?: boolean;
}

export interface SecuritySettingsData {
  passwordMinLength?: number;
  passwordRequireSpecialChar?: boolean;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  twoFactorEnabled?: boolean;
}

export interface CssSettingsData {
  primaryColor?: string;
  backgroundColor?: string;
  fontSize?: string;
  customCss?: string;
}

export interface GridSettingsData {
  rowNumber?: boolean;
  columnPinning?: boolean;
  animation?: boolean;
  tooltip?: boolean;
  quickFilter?: boolean;
  csvExport?: boolean;
  totalRowType?: string;
  searchMode?: string;
}

export interface ConditionSettingsData {
  defaultPageSize?: number;
  maxExportRows?: number;
  searchDebounceMs?: number;
}
