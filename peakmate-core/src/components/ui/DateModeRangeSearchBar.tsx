import type { ReactNode } from 'react';
import { FilterField } from './FilterField';
import { SearchCriteria } from './SearchCriteria';
import { DropDown } from './DropDown';

type DateModeRangeSearchBarProps<TMode extends string> = {
  dateMode: TMode;
  dateModeOptions: readonly TMode[];
  onDateModeChange: (value: TMode) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onSearch: () => void;
  onReset?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  label?: string;
  title?: string;
  className?: string;
};

export function DateModeRangeSearchBar<TMode extends string>({
  dateMode,
  dateModeOptions,
  onDateModeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onSearch,
  onReset,
  actions,
  children,
  label = '조회일자',
  title,
  className,
}: DateModeRangeSearchBarProps<TMode>) {
  const modeOptions = dateModeOptions.map(o => ({ value: o, label: o }));

  return (
    <div className={className}>
      <SearchCriteria onSearch={onSearch} onReset={onReset} actions={actions} title={title}>
        <FilterField label={label}>
          <div className="flex items-center gap-1">
            <DropDown
              options={modeOptions}
              value={dateMode}
              onChange={e => onDateModeChange(e.target.value as TMode)}
              btnWidth={80}
              heightType="h32"
            />
            <input
              type="date"
              className="h-8 text-sm border border-[var(--color-border)] rounded px-2"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => onDateFromChange(e.target.value)}
            />
            <span className="text-sm text-gray-400">~</span>
            <input
              type="date"
              className="h-8 text-sm border border-[var(--color-border)] rounded px-2"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => onDateToChange(e.target.value)}
            />
          </div>
        </FilterField>
        {children}
      </SearchCriteria>
    </div>
  );
}
