import React from 'react';

export interface CustomRadioProps {
  label?: string;
  labelPlacement?: 'start' | 'end';
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  value?: string | number;
}

export const CustomRadio = ({ label, labelPlacement = 'end', checked, onChange, disabled, name, value }: CustomRadioProps) => {
  const radio = (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value as any}
      />
      <span
        className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
          checked ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
        }`}
        style={{ width: 16, height: 16 }}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
      </span>
    </label>
  );

  if (!label) return radio;

  return (
    <label className={`inline-flex items-center gap-2 whitespace-nowrap text-[13px] cursor-pointer ${disabled ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]'}`}>
      {labelPlacement === 'start' && <span>{label}</span>}
      {radio}
      {labelPlacement === 'end' && <span>{label}</span>}
    </label>
  );
};

export default CustomRadio;

export interface BoxRadioProps {
  label: string;
  value: string;
  checked?: boolean;
  onChange?: () => void;
}

export const BoxRadio = ({ label, checked, onChange }: BoxRadioProps) => (
  <button
    type="button"
    onClick={onChange}
    className={`inline-flex items-center px-3 h-8 border rounded-md text-[13px] select-none cursor-pointer transition-colors ${
      checked
        ? 'bg-black text-white border-black'
        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
    }`}
  >
    {label}
  </button>
);
