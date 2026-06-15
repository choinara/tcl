import { useState, type CSSProperties } from 'react';
import { Search } from 'lucide-react';
import { PickerDialog, type PickerDialogProps } from './PickerDialog';

const fieldDisplayStyle: CSSProperties = {
  height: 32, fontSize: 14, padding: '0 8px',
  border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
  boxSizing: 'border-box',
  display: 'flex', alignItems: 'center',
  backgroundColor: '#f9fafb',
  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
};

export interface PickerFieldProps<T> extends Omit<PickerDialogProps<T>, 'open' | 'onClose'> {
  value?: T | null;
  displayText?: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

export function PickerField<T>({
  value,
  displayText,
  placeholder = '돋보기 버튼을 눌러 선택하세요',
  disabled,
  style,
  ...dialogProps
}: PickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const hasValue = value != null;
  const display = hasValue && displayText ? displayText(value) : '';

  return (
    <>
      <div style={{ display: 'flex', gap: 6, ...style }}>
        <div
          style={{
            ...fieldDisplayStyle,
            flex: 1,
            color: hasValue ? '#111827' : '#9ca3af',
          }}
          title={display}
        >
          {hasValue ? display : placeholder}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="mes-btn"
          aria-label={dialogProps.title ?? '검색'}
          style={{
            width: 36, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Search size={16} />
        </button>
      </div>
      <PickerDialog<T>
        open={open}
        onClose={() => setOpen(false)}
        {...dialogProps}
      />
    </>
  );
}
