import { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

export interface MonthYearPickerProps {
  value?: string | null;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: number | string;
}

const CustomInput = forwardRef<HTMLDivElement, { value?: string; onClick?: () => void; placeholder?: string; disabled?: boolean; inputWidth?: number | string }>(
  ({ value, onClick, placeholder, disabled, inputWidth }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={`inline-flex items-center border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 text-[length:var(--font-size-base)] cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
      style={{ width: inputWidth ?? 310, height: 40 }}
    >
      <span className={`flex-1 ${!value ? 'text-[var(--color-text-disabled)]' : ''}`}>
        {value || placeholder}
      </span>
      <Calendar size={18} className="shrink-0 text-[var(--color-text-secondary)]" />
    </div>
  ),
);
CustomInput.displayName = 'CustomInput';

export const MonthYearPicker = ({ value, onChange, placeholder = '년/월 선택', disabled, width }: MonthYearPickerProps) => {
  const parseValue = (val: string | null | undefined): Date | null => {
    if (!val) return null;
    const [year, month] = val.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  };

  const formatValue = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="[&_.react-datepicker-wrapper]:w-full">
      <ReactDatePicker
        selected={parseValue(value)}
        onChange={(date: Date | null) => onChange?.(formatValue(date))}
        customInput={<CustomInput placeholder={placeholder} disabled={disabled} inputWidth={width} />}
        dateFormat="yyyy/MM"
        showMonthYearPicker
        disabled={disabled}
        placeholderText={placeholder}
        locale="ko"
        popperPlacement="bottom-start"
        showPopperArrow={false}
      />
    </div>
  );
};

export default MonthYearPicker;
