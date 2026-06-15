import { FilterField } from './FilterField';
import { YearMonthPicker } from './YearMonthPicker';

interface MonthFilterProps {
  label?: string;
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
}

export function MonthFilter({
  label = '기준월',
  year,
  month,
  onChange,
  disabled,
}: MonthFilterProps) {
  return (
    <FilterField label={label}>
      <YearMonthPicker year={year} month={month} onChange={onChange} disabled={disabled} />
    </FilterField>
  );
}
