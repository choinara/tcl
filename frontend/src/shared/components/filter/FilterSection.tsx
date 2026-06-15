import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  activeCount?: number;
  disabled?: boolean;
  onChange?: (expanded: boolean) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  activeCount,
  disabled = false,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (disabled) return;
    const next = !expanded;
    setExpanded(next);
    onChange?.(next);
  };

  return (
    <div className={`border border-[var(--color-border)] rounded ${disabled ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between min-h-[36px] px-3 py-1.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-medium">{title}</span>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown size={20} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border)]">
          <div className="pt-2">{children}</div>
        </div>
      )}
    </div>
  );
};

export interface FilterContainerProps {
  children: React.ReactNode;
  title?: string;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({ children, title }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

export default FilterSection;
