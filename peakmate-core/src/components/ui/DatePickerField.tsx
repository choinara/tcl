import { useContext } from 'react';
import { ModalSizeContext } from './Modal';
import type { ModalSize } from './Modal';
import { DateInput } from './DateInput';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

const sizeMap: Record<ModalSize, { mb: number; labelSize: string; labelMb: number; inputHeight: number }> = {
  default: { mb: 12, labelSize: 'var(--font-size-base)', labelMb: 4, inputHeight: 32 },
  compact: { mb: 6, labelSize: 'var(--font-size-sm)', labelMb: 2, inputHeight: 27 },
  wide:    { mb: 8, labelSize: 'var(--font-size-sm)', labelMb: 3, inputHeight: 28 },
};

export function DatePickerField({ label, value, onChange, required, error, disabled, minDate, maxDate, placeholder }: DatePickerFieldProps) {
  const mode = useContext(ModalSizeContext);
  const s = sizeMap[mode];

  return (
    <div style={{ marginBottom: s.mb }}>
      <label style={{ display: 'block', fontSize: s.labelSize, fontWeight: 500, color: '#374151', marginBottom: s.labelMb }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ width: '100%' }}>
        <DateInput
          value={value}
          onChange={onChange}
          height={s.inputHeight}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          placeholder={placeholder}
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
