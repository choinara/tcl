import { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale/ko';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

export interface MonthInputProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  disabled?: boolean;
  placeholder?: string;
}

/** "YYYY-MM" → Date */
function parseMonth(s: string): Date | null {
  if (!s) return null;
  const [y, m] = s.split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}

/** Date → "YYYY-MM" */
function formatMonth(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
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
        minWidth: 110,
      }}
    >
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', color: value ? undefined : 'var(--color-text-muted, #94a3b8)' }}>
        {value || placeholder}
      </span>
      <Calendar size={14} style={{ flexShrink: 0, color: 'var(--color-text-secondary, #64748b)', marginLeft: 4 }} />
    </div>
  ),
);
CustomInput.displayName = 'MonthInputCustom';

export function MonthInput({ value, onChange, height = 28, disabled, placeholder = '월 선택' }: MonthInputProps) {
  return (
    <ReactDatePicker
      selected={parseMonth(value)}
      onChange={(d: Date | null) => onChange(formatMonth(d))}
      customInput={<CustomInput placeholder={placeholder} disabled={disabled} inputHeight={height} />}
      dateFormat="yyyy-MM"
      showMonthYearPicker
      disabled={disabled}
      placeholderText={placeholder}
      locale="ko"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      enableTabLoop={false}
      portalId="datepicker-portal"
    />
  );
}
