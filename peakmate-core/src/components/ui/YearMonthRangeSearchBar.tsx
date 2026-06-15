import type { ReactNode } from 'react';
import { FilterField } from './FilterField';
import { SearchCriteria } from './SearchCriteria';
import { YearMonthPicker } from './YearMonthPicker';

type YearMonthRangeSearchBarProps = {
  fromYear: number;
  fromMonth: number;
  onFromChange: (year: number, month: number) => void;
  toYear: number;
  toMonth: number;
  onToChange: (year: number, month: number) => void;
  onSearch: () => void;
  onReset?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  fromLabel?: string;
  toLabel?: string;
  title?: string;
  className?: string;
};

export function YearMonthRangeSearchBar({
  fromYear,
  fromMonth,
  onFromChange,
  toYear,
  toMonth,
  onToChange,
  onSearch,
  onReset,
  actions,
  children,
  fromLabel = '조회연월(From)',
  toLabel = '~(To)',
  title,
  className,
}: YearMonthRangeSearchBarProps) {
  return (
    <div className={className}>
      <SearchCriteria onSearch={onSearch} onReset={onReset} actions={actions} title={title}>
        <FilterField label={fromLabel}>
          <YearMonthPicker year={fromYear} month={fromMonth} onChange={onFromChange} />
        </FilterField>
        <FilterField label={toLabel}>
          <YearMonthPicker year={toYear} month={toMonth} onChange={onToChange} />
        </FilterField>
        {children}
      </SearchCriteria>
    </div>
  );
}
