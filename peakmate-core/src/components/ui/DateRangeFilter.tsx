import { FilterField } from './FilterField';
import { DateRangeInput } from './DateRangeInput';

interface DateRangeFilterProps {
  label?: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  disabled?: boolean;
}

export function DateRangeFilter({
  label = '기간',
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  disabled,
}: DateRangeFilterProps) {
  return (
    <FilterField label={label}>
      <DateRangeInput
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        disabled={disabled}
      />
    </FilterField>
  );
}
