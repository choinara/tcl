import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
  suffix?: React.ReactNode;
  labelPosition?: 'top' | 'left';
  labelWidth?: number | string;
  gap?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const RequiredMark = () => <span className="text-red-500 ml-1">*</span>;

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  suffix,
  children,
  labelPosition = 'top',
  labelWidth = 'auto',
  gap,
  className,
  style,
}) => {
  if (labelPosition === 'left') {
    const resolvedGap = gap ?? '10px';
    return (
      <div className={`flex flex-row items-center ${className ?? ''}`} style={{ gap: resolvedGap, ...style }}>
        <span
          className="text-sm font-normal text-[var(--color-text-primary)] shrink-0"
          style={{ width: labelWidth }}
        >
          {label}
          {required && <RequiredMark />}
        </span>
        <div className="flex-1">
          {children}
          {helperText && <span className="text-xs text-[#999] mt-1 block">{helperText}</span>}
        </div>
        {suffix && <span className="text-xs text-[#999] font-normal shrink-0">{suffix}</span>}
      </div>
    );
  }

  const resolvedGap = gap ?? '6px';
  return (
    <div className={`flex flex-col ${className ?? ''}`} style={{ gap: resolvedGap, ...style }}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-normal text-[var(--color-text-primary)]">
          {label}
          {required && <RequiredMark />}
        </span>
        {suffix && <span className="text-xs text-[#999] font-normal">{suffix}</span>}
      </div>
      {children}
      {helperText && <span className="text-xs text-[#999] mt-1">{helperText}</span>}
    </div>
  );
};

export interface FormLayoutProps {
  children: React.ReactNode;
  title?: string;
  gap?: number | string;
  layout?: 'column' | 'row';
  className?: string;
  style?: React.CSSProperties;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  title,
  gap = 16,
  layout = 'column',
  className,
  style,
}) => {
  return (
    <div className={`flex flex-col w-full ${className ?? ''}`} style={style}>
      {title && (
        <div className="border-b border-[#DFE1E6]">
          <div className="ml-5 mb-3.5 mt-3">
            <span className="text-base font-bold">{title}</span>
          </div>
        </div>
      )}
      <div
        className="pt-2"
        style={{
          display: 'flex',
          flexDirection: layout,
          gap: typeof gap === 'number' ? `${gap}px` : gap,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default FormLayout;
