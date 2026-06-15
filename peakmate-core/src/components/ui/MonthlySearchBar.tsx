import type { ReactNode } from 'react';
import { FilterField } from './FilterField';
import { SearchCriteria } from './SearchCriteria';
import { YearMonthPicker } from './YearMonthPicker';

type MonthlySearchBarProps<TPeriod extends string> = {
  year: number;
  month: number;
  onYearMonthChange: (year: number, month: number) => void;
  period: TPeriod;
  periodOptions: readonly TPeriod[];
  onPeriodChange: (period: TPeriod) => void;
  onSearch?: () => void;
  onReset?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  monthLabel?: string;
  periodLabel?: string;
  className?: string;
  hideSearch?: boolean;
};

export function MonthlySearchBar<TPeriod extends string>({
  year,
  month,
  onYearMonthChange,
  period,
  periodOptions,
  onPeriodChange,
  onSearch,
  onReset,
  actions,
  children,
  monthLabel = '조회연월',
  periodLabel = '기간선택',
  className,
  hideSearch,
}: MonthlySearchBarProps<TPeriod>) {
  return (
    <div className={className}>
      <SearchCriteria onSearch={onSearch} onReset={onReset} actions={actions} hideSearch={hideSearch}>
        <FilterField label={monthLabel}>
          <YearMonthPicker year={year} month={month} onChange={onYearMonthChange} />
        </FilterField>
        <FilterField label={periodLabel}>
          <div className="inline-flex items-center rounded-xl bg-gray-100 p-1">
            {periodOptions.map((option) => {
              const isSelected = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onPeriodChange(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-white text-[var(--color-primary,#3b82f6)] shadow-sm'
                      : 'text-gray-500 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </FilterField>
        {children}
      </SearchCriteria>
    </div>
  );
}
