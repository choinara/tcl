import { FilterField } from './FilterField';
import { YearMonthPicker } from './YearMonthPicker';

interface MonthRangeFilterProps {
  label?: string;
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  onFromChange: (year: number, month: number) => void;
  onToChange: (year: number, month: number) => void;
  disabled?: boolean;
}

const separatorStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary, #64748b)',
  fontSize: 'var(--font-size-sm)',
};

export function MonthRangeFilter({
  label = '기간',
  fromYear,
  fromMonth,
  toYear,
  toMonth,
  onFromChange,
  onToChange,
  disabled,
}: MonthRangeFilterProps) {
  return (
    <FilterField label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <YearMonthPicker year={fromYear} month={fromMonth} onChange={onFromChange} disabled={disabled} />
        <span style={separatorStyle}>~</span>
        <YearMonthPicker year={toYear} month={toMonth} onChange={onToChange} disabled={disabled} />
      </div>
    </FilterField>
  );
}
