import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
}

const CustomSwitch = ({ checked, onChange, disabled, name }: SwitchProps) => {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
      />
      <div
        className={`w-[60px] h-8 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-primary)]' : 'bg-[#DCDCDC]'
        }`}
      >
        <div
          className={`w-[26px] h-[26px] rounded-full bg-white shadow transition-transform mt-[3px] ${
            checked ? 'translate-x-[31px]' : 'translate-x-[3px]'
          }`}
        />
      </div>
    </label>
  );
};

export default CustomSwitch;
