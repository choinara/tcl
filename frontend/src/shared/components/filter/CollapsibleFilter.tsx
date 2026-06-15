import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export interface CollapsibleFilterProps {
  title: string;
  filterContent: React.ReactNode;
  actionButtons?: React.ReactNode;
  onSearch?: () => void;
  searchButtonText?: string;
  defaultExpanded?: boolean;
  expandButtonText?: string;
  collapseButtonText?: string;
}

export const CollapsibleFilter: React.FC<CollapsibleFilterProps> = ({
  title,
  filterContent,
  actionButtons,
  onSearch,
  searchButtonText = '검색',
  defaultExpanded = true,
  expandButtonText = '필터 닫기',
  collapseButtonText = '필터 열기',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="w-full border border-[var(--color-border)] rounded overflow-hidden">
      <div className="flex justify-between items-center min-h-[36px] bg-gray-50 border-b border-[var(--color-border)] px-3 py-1.5">
        <span className="text-lg font-bold">{title}</span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {expanded ? expandButtonText : collapseButtonText}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && <div className="px-3 py-2">{filterContent}</div>}

      <div className="flex justify-between items-center px-3 py-2 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
        <div className="flex flex-wrap gap-2">{actionButtons}</div>
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded text-sm min-w-[100px] hover:opacity-90 transition-opacity"
          >
            <Search size={16} />
            {searchButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export interface FilterActionBarProps {
  actionButtons?: React.ReactNode;
  onSearch?: () => void;
  searchButtonText?: string;
}

export const FilterActionBar: React.FC<FilterActionBarProps> = ({
  actionButtons,
  onSearch,
  searchButtonText = '검색',
}) => (
  <div className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded">
    <div className="flex justify-between items-center">
      <div className="flex flex-wrap gap-2">{actionButtons}</div>
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded text-sm min-w-[100px] hover:opacity-90 transition-opacity"
        >
          <Search size={16} />
          {searchButtonText}
        </button>
      )}
    </div>
  </div>
);

export default CollapsibleFilter;
