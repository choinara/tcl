import { MonthInput } from './MonthInput';

interface YearMonthPickerProps {
  year: number;
  /** 1~12 */
  month: number;
  onChange: (year: number, month: number) => void;
  width?: number | string;
  disabled?: boolean;
}

/** MonthInput을 (year, month) API로 노출하는 래퍼 */
export function YearMonthPicker({ year, month, onChange, width, disabled }: YearMonthPickerProps) {
  const value = `${year}-${String(month).padStart(2, '0')}`;

  const handleChange = (yyyyMM: string) => {
    const [y, m] = yyyyMM.split('-').map(Number);
    if (y && m) onChange(y, m);
  };

  return <MonthInput value={value} onChange={handleChange} height={width ? undefined : undefined} disabled={disabled} />;
}
