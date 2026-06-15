import { FilterField } from './FilterField';
import { DateInput } from './DateInput';

interface SingleDateFilterProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function SingleDateFilter({
  label = '날짜',
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
}: SingleDateFilterProps) {
  return (
    <FilterField label={label}>
      <DateInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
      />
    </FilterField>
  );
}
