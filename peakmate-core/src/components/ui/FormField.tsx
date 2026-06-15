import { useContext, type InputHTMLAttributes } from 'react';
import { ModalSizeContext } from './Modal';
import type { ModalSize } from './Modal';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const sizeMap: Record<ModalSize, { mb: number; fontSize: string; labelSize: string; labelMb: number; padding: string; inputWidth: string }> = {
  default: { mb: 12, fontSize: 'var(--font-size-base)', labelSize: 'var(--font-size-base)', labelMb: 4, padding: '3px 10px', inputWidth: '100%' },
  compact: { mb: 6, fontSize: 'var(--font-size-sm)', labelSize: 'var(--font-size-sm)', labelMb: 2, padding: '3px 8px', inputWidth: '100%' },
  wide:    { mb: 8, fontSize: 'var(--font-size-base)', labelSize: 'var(--font-size-sm)', labelMb: 3, padding: '4px 8px', inputWidth: '100%' },
};

export function FormField({ label, error, required, id, ...inputProps }: FormFieldProps) {
  const mode = useContext(ModalSizeContext);
  const s = sizeMap[mode];
  const fieldId = id || `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div style={{ marginBottom: s.mb }}>
      <label htmlFor={fieldId} style={{ display: 'block', fontSize: s.labelSize, fontWeight: 500, color: '#374151', marginBottom: s.labelMb }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={fieldId}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...inputProps}
        style={{
          width: s.inputWidth,
          padding: s.padding,
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 4,
          fontSize: s.fontSize,
          boxSizing: 'border-box',
          ...inputProps.style,
        }}
      />
      {error && <p id={errorId} role="alert" style={{ color: '#ef4444', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
