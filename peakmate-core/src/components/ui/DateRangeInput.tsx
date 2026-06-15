import { useMemo } from 'react';
import { DateInput } from './DateInput';

export interface DateRangeInputProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
  height?: number;
  disabled?: boolean;
}

function parseDate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? undefined : d;
}

export function DateRangeInput({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  height = 28,
  disabled,
}: DateRangeInputProps) {
  const maxDateForFrom = useMemo(() => parseDate(dateTo), [dateTo]);
  const minDateForTo = useMemo(() => parseDate(dateFrom), [dateFrom]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <DateInput value={dateFrom} onChange={onDateFromChange} height={height} disabled={disabled} placeholder="시작일" maxDate={maxDateForFrom} />
      <span style={{ color: 'var(--color-text-secondary, #64748b)', fontSize: 'var(--font-size-sm)' }}>~</span>
      <DateInput value={dateTo} onChange={onDateToChange} height={height} disabled={disabled} placeholder="종료일" minDate={minDateForTo} />
    </div>
  );
}
