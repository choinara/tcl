import React from 'react';

export type TabVariantType = 'filter' | 'navigation' | 'simple';

export interface TabOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  closable?: boolean;
}

export interface CustomTabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: TabVariantType;
  onClose?: (value: string) => void;
  onTabContextMenu?: (event: React.MouseEvent, value: string) => void;
  maxWidth?: string | number;
  className?: string;
  style?: React.CSSProperties;
  scrollButtons?: string;
}

const variantStyles: Record<TabVariantType, { container: string; tab: string; activeTab: string; indicator: string }> = {
  filter: {
    container: 'border-b border-[var(--color-border)]',
    tab: 'text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-2.5 px-4',
    activeTab: 'text-[var(--color-text-primary)] font-semibold',
    indicator: 'bg-[var(--color-text-primary)] h-[3px] rounded-sm',
  },
  navigation: {
    container: '',
    tab: 'text-[13px] bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)] px-3 py-2 -ml-px first:ml-0 min-w-[150px]',
    activeTab: 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-bold border-b-0 z-10',
    indicator: 'bg-[var(--color-primary)] h-[3px] top-0',
  },
  simple: {
    container: 'border-b border-[var(--color-border)]',
    tab: 'text-[13px] text-[var(--color-text-secondary)] py-2 px-4',
    activeTab: 'text-[var(--color-primary)]',
    indicator: 'bg-[var(--color-primary)] h-0.5',
  },
};

export const CustomTabs = React.forwardRef<HTMLDivElement, CustomTabsProps>(
  ({ options, value, onChange, variant = 'simple', onClose, onTabContextMenu, maxWidth, className, style }, ref) => {
    const styles = variantStyles[variant];

    return (
      <div
        ref={ref}
        className={`flex overflow-x-auto w-full ${styles.container} ${className ?? ''}`}
        style={{ maxWidth, ...style }}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              onContextMenu={(e) => onTabContextMenu?.(e, option.value)}
              className={`relative whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.tab} ${isActive ? styles.activeTab : ''}`}
            >
              <span className="flex items-center gap-1">
                {option.icon}
                <span className="truncate">{option.label}</span>
                {variant === 'navigation' && option.closable && (
                  <span
                    onClick={(e) => { e.stopPropagation(); onClose?.(option.value); }}
                    className="ml-1 p-0.5 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  >
                    &times;
                  </span>
                )}
              </span>
              {isActive && <span className={`absolute bottom-0 left-0 right-0 ${styles.indicator}`} />}
            </button>
          );
        })}
      </div>
    );
  },
);
CustomTabs.displayName = 'CustomTabs';

export const FilterTabs = React.forwardRef<HTMLDivElement, Omit<CustomTabsProps, 'variant'>>((props, ref) => (
  <CustomTabs ref={ref} variant="filter" {...props} />
));
FilterTabs.displayName = 'FilterTabs';

export const NavigationTabs = React.forwardRef<HTMLDivElement, Omit<CustomTabsProps, 'variant'>>((props, ref) => (
  <CustomTabs ref={ref} variant="navigation" {...props} />
));
NavigationTabs.displayName = 'NavigationTabs';

export const SimpleTabs = React.forwardRef<HTMLDivElement, Omit<CustomTabsProps, 'variant'>>((props, ref) => (
  <CustomTabs ref={ref} variant="simple" {...props} />
));
SimpleTabs.displayName = 'SimpleTabs';

export default CustomTabs;
