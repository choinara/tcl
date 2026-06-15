import { FilterField } from './FilterField';

interface KeywordFilterProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  width?: number;
  disabled?: boolean;
}

export function KeywordFilter({
  label = '검색어',
  value,
  onChange,
  placeholder = '검색어 입력',
  onEnter,
  width = 160,
  disabled,
}: KeywordFilterProps) {
  return (
    <FilterField label={label}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); }}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          height: 28,
          width,
          padding: '0 8px',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 4,
          fontSize: 'var(--font-size-sm)',
          background: disabled ? '#f3f4f6' : 'var(--color-bg-white, #fff)',
          color: 'var(--color-text, #1e293b)',
          outline: 'none',
        }}
      />
    </FilterField>
  );
}
