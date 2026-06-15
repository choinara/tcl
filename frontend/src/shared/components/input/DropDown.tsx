import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

type DropdownHeightType = 'h40' | 'h32';

const heightMap: Record<DropdownHeightType, string> = {
  h40: 'h-10 text-sm',
  h32: 'h-8 text-[13px]',
};

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  heightType?: DropdownHeightType;
  btnWidth?: number | string;
  btnHeight?: number | string;
  options: DropdownOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (event: { target: { value: string | number } }) => void;
  disabled?: boolean;
  name?: string;
  sx?: React.CSSProperties;
  fullWidth?: boolean;
}

export const DropDown = (props: DropdownProps) => {
  const { options, placeholder, heightType = 'h40', btnWidth, btnHeight, value, onChange, disabled, name, sx, fullWidth } = props;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || '';

  const handleSelect = (optValue: string | number) => {
    onChange?.({ target: { value: optValue } });
    setIsOpen(false);
  };

  const wrapperStyle: React.CSSProperties = {
    width: btnWidth ?? (fullWidth ? '100%' : undefined),
    minWidth: btnWidth ?? undefined,
    ...sx,
  };

  return (
    <div ref={ref} className="relative" style={wrapperStyle}>
      <input type="hidden" name={name} value={value ?? ''} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed ${heightMap[heightType]}`}
        style={btnHeight ? { height: typeof btnHeight === 'number' ? `${btnHeight}px` : btnHeight } : undefined}
      >
        <span className={`truncate ${!displayText ? 'text-[var(--color-text-disabled)]' : ''}`}>
          {displayText || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && handleSelect(option.value)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg-hover)] disabled:text-[var(--color-text-disabled)] disabled:cursor-not-allowed ${
                option.value === value ? 'bg-[var(--color-bg-secondary)] font-medium' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropDown;
