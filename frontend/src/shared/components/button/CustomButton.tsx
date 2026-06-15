import React from 'react';
import { Search, Plus } from 'lucide-react';

type ButtonVariantType = 'primary' | 'gray' | 'ghost';
type ButtonHeightType = 'h40' | 'h32';

const heightMap: Record<ButtonHeightType, string> = {
  h40: 'h-10',
  h32: 'h-8',
};

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  btnType?: ButtonVariantType;
  heightType?: ButtonHeightType;
  iconOnly?: boolean;
  btnWidth?: number | string;
  btnHeight?: number | string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

interface CustomIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  btnType?: ButtonVariantType;
}

const variantClasses: Record<ButtonVariantType, string> = {
  primary:
    'bg-[var(--color-primary)] text-white border border-[var(--color-border)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
  gray:
    'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed',
};

const baseClasses =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium leading-none transition-colors focus:outline-none';

export const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ btnType = 'primary', heightType, iconOnly, btnWidth, btnHeight, startIcon, endIcon, className, style, children, ...rest }, ref) => {
    const hCls = heightType ? heightMap[heightType] : '';
    const widthStyle: React.CSSProperties = {};
    if (btnWidth !== undefined) {
      widthStyle.width = typeof btnWidth === 'number' ? `${btnWidth}px` : btnWidth;
      widthStyle.minWidth = widthStyle.width;
    }
    if (btnHeight !== undefined) {
      widthStyle.height = typeof btnHeight === 'number' ? `${btnHeight}px` : btnHeight;
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[btnType]} ${hCls} ${iconOnly ? 'p-1.5 min-w-0' : 'px-3'} ${className ?? ''}`}
        style={{ ...widthStyle, ...style }}
        {...rest}
      >
        {startIcon && <span className={children ? 'mr-1.5' : ''}>{startIcon}</span>}
        {children}
        {endIcon && <span className={children ? 'ml-1.5' : ''}>{endIcon}</span>}
      </button>
    );
  },
);
CustomButton.displayName = 'CustomButton';

export const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<CustomButtonProps, 'btnType'>>((props, ref) => (
  <CustomButton ref={ref} btnType="primary" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const GrayButton = React.forwardRef<HTMLButtonElement, Omit<CustomButtonProps, 'btnType'>>((props, ref) => (
  <CustomButton ref={ref} btnType="gray" {...props} />
));
GrayButton.displayName = 'GrayButton';

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<CustomButtonProps, 'btnType'>>((props, ref) => (
  <CustomButton ref={ref} btnType="ghost" {...props} />
));
GhostButton.displayName = 'GhostButton';

export const CustomIconButton = React.forwardRef<HTMLButtonElement, CustomIconButtonProps>(
  ({ btnType = 'primary', className, ...rest }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center p-1 rounded hover:bg-transparent transition-colors disabled:opacity-50 ${className ?? ''}`}
      style={{ color: btnType === 'primary' ? 'var(--color-primary)' : undefined }}
      {...rest}
    />
  ),
);
CustomIconButton.displayName = 'CustomIconButton';

export const FilterSearchButton = ({ children = '검색', ...props }: Omit<CustomButtonProps, 'btnType'>) => (
  <CustomButton
    btnType="ghost"
    heightType="h32"
    startIcon={<Search size={18} />}
    type="submit"
    {...props}
  >
    {children}
  </CustomButton>
);

export const PartAddButton = ({ children = '추가', ...props }: Omit<CustomButtonProps, 'btnType'>) => (
  <GhostButton startIcon={<Plus size={16} />} {...props}>
    {children}
  </GhostButton>
);

export const FilterResetButton = ({ children = '초기화', ...props }: Omit<CustomButtonProps, 'btnType'>) => (
  <GrayButton heightType="h32" type="button" {...props}>
    {children}
  </GrayButton>
);

export default CustomButton;
