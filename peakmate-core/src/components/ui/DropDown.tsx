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

  const selected = options.find(o => o.value === value);
  const displayText = selected ? selected.label : (placeholder ?? '선택');

  const widthStyle = fullWidth ? 'w-full' : '';
  const heightStyle = heightMap[heightType];

  return (
    <div
      ref={ref}
      className={`relative inline-block ${widthStyle}`}
      style={{ width: fullWidth ? '100%' : btnWidth, height: btnHeight, ...sx }}
    >
      <button
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-1 px-3 border border-[var(--color-border,#d1d5db)] rounded bg-[var(--color-bg-white,#fff)] text-[var(--color-text,#111827)] w-full ${heightStyle} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-0.5 z-50 bg-white border border-[var(--color-border,#d1d5db)] rounded shadow-md min-w-full max-h-60 overflow-y-auto">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                if (!opt.disabled) {
                  onChange?.({ target: { value: opt.value } });
                  setIsOpen(false);
                }
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${opt.value === value ? 'bg-blue-50 font-semibold' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
