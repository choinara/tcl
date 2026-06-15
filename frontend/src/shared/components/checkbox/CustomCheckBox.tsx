import React, { type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';

type CheckBoxVariantType = 'primary' | 'secondary' | 'error';
type CheckBoxSizeType = 'small' | 'medium' | 'large';

const sizeMap: Record<CheckBoxSizeType, number> = { small: 16, medium: 20, large: 24 };

interface CustomCheckBoxProps {
  variant?: CheckBoxVariantType;
  label?: string;
  labelPlacement?: 'start' | 'end';
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: CheckBoxSizeType;
  name?: string;
  value?: string | number;
  sx?: React.CSSProperties;
  className?: string;
}

const Checkbox = ({ checked, indeterminate, disabled, size = 'small', onChange, name, value }: CustomCheckBoxProps) => {
  const px = sizeMap[size];
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value as any}
      />
      <span
        className={`inline-flex items-center justify-center rounded border transition-colors ${
          checked || indeterminate
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
            : 'bg-white border-[var(--color-border)]'
        }`}
        style={{ width: px, height: px }}
      >
        {indeterminate ? <Minus size={px - 4} /> : checked ? <Check size={px - 4} /> : null}
      </span>
    </label>
  );
};

const WithLabel = ({ label, labelPlacement = 'end', children, disabled }: { label?: string; labelPlacement?: 'start' | 'end'; children: ReactNode; disabled?: boolean }) => {
  if (!label) return <>{children}</>;
  return (
    <label className={`inline-flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer ${disabled ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]'}`}>
      {labelPlacement === 'start' && <span>{label}</span>}
      {children}
      {labelPlacement === 'end' && <span>{label}</span>}
    </label>
  );
};

export const CustomCheckBox = (props: CustomCheckBoxProps) => {
  const { label, labelPlacement = 'end', ...rest } = props;
  return (
    <WithLabel label={label} labelPlacement={labelPlacement} disabled={rest.disabled}>
      <Checkbox {...rest} />
    </WithLabel>
  );
};

export const PrimaryCheckBox = (props: Omit<CustomCheckBoxProps, 'variant'>) => <CustomCheckBox variant="primary" {...props} />;
export const SecondaryCheckBox = (props: Omit<CustomCheckBoxProps, 'variant'>) => <CustomCheckBox variant="secondary" {...props} />;
export const ErrorCheckBox = (props: Omit<CustomCheckBoxProps, 'variant'>) => <CustomCheckBox variant="error" {...props} />;
export const IndeterminateCheckBox = (props: Omit<CustomCheckBoxProps, 'variant' | 'indeterminate'>) => <CustomCheckBox variant="primary" indeterminate {...props} />;

interface BoxCheckBoxProps extends CustomCheckBoxProps {
  label: string;
}

export const BoxCheckBox = ({ label, checked, onChange, disabled, ...rest }: BoxCheckBoxProps) => (
  <div
    className={`inline-flex items-center gap-3 px-4 py-3 border border-[var(--color-border)] rounded bg-white cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={() => !disabled && onChange?.({ target: { checked: !checked } } as any)}
  >
    <Checkbox checked={checked} disabled={disabled} onChange={onChange} {...rest} />
    <span className={`text-sm font-medium select-none ${disabled ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]'}`}>{label}</span>
  </div>
);

interface ToggleCheckBoxProps {
  checked?: boolean;
  onChange?: (e: any, checked?: boolean) => void;
  label?: ReactNode;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
  btnWidth?: number | string;
  btnHeight?: number | string;
  sx?: React.CSSProperties;
  variant?: string;
  styleVariant?: string;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  padding?: string;
  borderRadius?: number | string;
  fontSize?: string;
  fontWeight?: number | string;
  onIcon?: ReactNode;
  offIcon?: ReactNode;
  children?: ReactNode;
  transitionDuration?: number;
}

export const ToggleCheckBox = ({
  checked = false,
  onChange,
  label,
  onLabel,
  offLabel,
  disabled = false,
  btnWidth,
  btnHeight,
  sx,
  activeColor,
  inactiveColor,
  activeTextColor,
  inactiveTextColor,
  onIcon,
  offIcon,
  children,
}: ToggleCheckBoxProps) => {
  const hasLabel = label !== undefined;
  const finalOnLabel = onLabel ?? (hasLabel ? label : 'ON');
  const finalOffLabel = offLabel ?? (hasLabel ? label : 'OFF');

  const handleClick = () => {
    if (!disabled) {
      onChange?.({ target: { checked: !checked } } as any, !checked);
    }
  };

  const bgColor = checked
    ? (activeColor || 'var(--color-primary)')
    : (inactiveColor || 'var(--color-bg-secondary)');
  const textColor = checked
    ? (activeTextColor || '#fff')
    : (inactiveTextColor || 'var(--color-text-primary)');

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded px-3 text-sm leading-none whitespace-nowrap transition-all select-none hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${checked ? bgColor : 'var(--color-border)'}`,
        height: btnHeight ? (typeof btnHeight === 'number' ? `${btnHeight}px` : btnHeight) : '32px',
        width: btnWidth ? (typeof btnWidth === 'number' ? `${btnWidth}px` : btnWidth) : undefined,
        minWidth: btnWidth ? (typeof btnWidth === 'number' ? `${btnWidth}px` : btnWidth) : undefined,
        ...sx,
      }}
    >
      {children ?? (
        <>
          {checked ? onIcon : offIcon}
          <span>{checked ? finalOnLabel : finalOffLabel}</span>
        </>
      )}
    </button>
  );
};

export default CustomCheckBox;
