import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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

export interface MultiSelectDropdownProps {
  heightType?: DropdownHeightType;
  options: DropdownOption[];
  placeholder?: string;
  groupLabel?: string;
  value?: (string | number)[];
  onChange?: (event: { target: { value: (string | number)[] } }) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  renderCustomValue?: (selected: (string | number)[], options: DropdownOption[], groupLabel?: string) => React.ReactNode;
}

export const MultiSelectDropdown = ({
  options,
  placeholder = '선택하세요',
  groupLabel,
  renderCustomValue,
  heightType = 'h40',
  value = [],
  onChange,
  disabled,
  fullWidth,
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedArray = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = (optValue: string | number) => {
    const newVal = selectedArray.includes(optValue)
      ? selectedArray.filter((v) => v !== optValue)
      : [...selectedArray, optValue];
    onChange?.({ target: { value: newVal } });
  };

  const displayText = () => {
    if (selectedArray.length === 0) return null;
    if (renderCustomValue) return renderCustomValue(selectedArray, options, groupLabel);
    return selectedArray.map((v) => options.find((o) => o.value === v)?.label || v).join(', ');
  };

  return (
    <div ref={ref} className="relative" style={{ width: fullWidth ? '100%' : 320 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed ${heightMap[heightType]}`}
      >
        <span className={`truncate ${selectedArray.length === 0 ? 'text-[var(--color-text-disabled)]' : ''}`}>
          {displayText() || placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && handleToggle(option.value)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-bg-hover)] disabled:text-[var(--color-text-disabled)] disabled:cursor-not-allowed"
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                  selectedArray.includes(option.value)
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {selectedArray.includes(option.value) && <Check size={12} />}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
