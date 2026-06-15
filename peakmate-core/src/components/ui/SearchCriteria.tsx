import type { ReactNode } from 'react';

interface SearchCriteriaProps {
  onSearch?: () => void;
  onReset?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  title?: string;
  className?: string;
  hideSearch?: boolean;
}

export function SearchCriteria({ onSearch, onReset, actions, children, title, className, hideSearch }: SearchCriteriaProps) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-2 ${className ?? ''}`}>
      {title && (
        <span className="text-xs font-bold text-[var(--color-text,#111827)]">{title}</span>
      )}
      {children}
      <div className="flex items-center gap-1 ml-auto">
        {actions}
        {onReset && (
          <button type="button" className="mes-btn" onClick={onReset}>
            초기화
          </button>
        )}
        {!hideSearch && onSearch && (
          <button type="button" className="mes-btn" onClick={onSearch}>
            조회
          </button>
        )}
      </div>
    </div>
  );
}
