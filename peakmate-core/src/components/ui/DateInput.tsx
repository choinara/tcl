import { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  disabled?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CustomInputProps {
  value?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  placeholder?: string;
  disabled?: boolean;
  inputHeight?: number;
}

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  ({ value, onClick, placeholder, disabled, inputHeight = 28 }, ref) => (
    <div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 4,
        background: disabled ? '#f3f4f6' : 'var(--color-bg-white, #fff)',
        color: 'var(--color-text, #1e293b)',
        padding: '0 8px',
        fontSize: 'var(--font-size-sm)',
        height: inputHeight,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        minWidth: 120,
      }}
    >
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', color: value ? undefined : 'var(--color-text-muted, #94a3b8)' }}>
        {value || placeholder}
      </span>
      <Calendar size={14} style={{ flexShrink: 0, color: 'var(--color-text-secondary, #64748b)', marginLeft: 4 }} />
    </div>
  ),
);
CustomInput.displayName = 'DateInputCustom';

export function DateInput({ value, onChange, height = 28, disabled, placeholder = '날짜 선택', minDate, maxDate }: DateInputProps) {
  return (
    <ReactDatePicker
      selected={parseDate(value)}
      onChange={(d: Date | null) => onChange(formatDate(d))}
      customInput={<CustomInput placeholder={placeholder} disabled={disabled} inputHeight={height} />}
      dateFormat="yyyy-MM-dd"
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholder}
      locale="ko"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      enableTabLoop={false}
      portalId="datepicker-portal"
    />
  );
}
