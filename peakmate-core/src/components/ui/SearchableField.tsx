import { useContext, type InputHTMLAttributes } from 'react';
import { ModalSizeContext } from './Modal';
import type { ModalSize } from './Modal';
import { Search } from 'lucide-react';

interface SearchableFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onKeyDown'> {
  label: string;
  error?: string;
  onSearch: () => void;
}

const sizeMap: Record<ModalSize, { mb: number; fontSize: string; labelSize: string; labelMb: number; padding: string; inputWidth: string; iconSize: number; btnPadding: string }> = {
  default: { mb: 12, fontSize: 'var(--font-size-md)', labelSize: 'var(--font-size-base)', labelMb: 4, padding: '6px 10px', inputWidth: '100%', iconSize: 15, btnPadding: '6px 8px' },
  compact: { mb: 6, fontSize: 'var(--font-size-sm)', labelSize: 'var(--font-size-sm)', labelMb: 2, padding: '3px 8px', inputWidth: '100%', iconSize: 13, btnPadding: '3px 6px' },
  wide:    { mb: 8, fontSize: 'var(--font-size-base)', labelSize: 'var(--font-size-sm)', labelMb: 3, padding: '4px 8px', inputWidth: '75%', iconSize: 14, btnPadding: '4px 6px' },
};

export function SearchableField({ label, error, required, onSearch, ...inputProps }: SearchableFieldProps) {
  const mode = useContext(ModalSizeContext);
  const s = sizeMap[mode];

  return (
    <div style={{ marginBottom: s.mb }}>
      <label style={{ display: 'block', fontSize: s.labelSize, fontWeight: 500, color: '#374151', marginBottom: s.labelMb }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          {...inputProps}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
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
        <button
          type="button"
          onClick={onSearch}
          style={{
            padding: s.btnPadding,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            background: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="조회"
        >
          <Search size={s.iconSize} color="#6b7280" />
        </button>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
