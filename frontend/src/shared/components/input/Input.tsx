import React, { useState, useCallback, useMemo, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { X } from 'lucide-react';

type InputHeightType = 'h40' | 'h32';
type InputLayout = 'short' | 'long';

const heightClasses: Record<InputHeightType, string> = {
  h40: 'h-10 text-sm',
  h32: 'h-8 text-[13px]',
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange' | 'size'> {
  heightType?: InputHeightType;
  layout?: InputLayout;
  btnWidth?: number | string;
  btnHeight?: number | string;
  width?: number | string;
  height?: number | string;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  showResizeGrip?: boolean;
  multiline?: boolean;
  rows?: number;
  error?: string;
  sx?: React.CSSProperties;
  inputProps?: Record<string, unknown>;
}

const InputComponent = (props: InputProps) => {
  const {
    heightType = 'h40',
    layout = 'short',
    btnWidth,
    btnHeight,
    width,
    height,
    value: controlledValue,
    onChange,
    onClear,
    showClearButton = true,
    showResizeGrip: showResizeGripProp,
    multiline,
    rows = 4,
    error,
    placeholder,
    disabled,
    readOnly,
    sx,
    inputProps: customInputProps,
    className,
    ...rest
  } = props;

  const isMultiline = multiline !== undefined ? multiline : layout === 'long';
  const showResizeGrip = showResizeGripProp !== undefined ? showResizeGripProp : layout === 'long';

  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [onChange, controlledValue],
  );

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) setInternalValue('');
    onChange?.('');
    if (props.onBlur) (props.onBlur as unknown as () => void)();
    onClear?.();
  }, [onChange, onClear, controlledValue, props]);

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {};
    if (btnWidth !== undefined) {
      s.width = typeof btnWidth === 'number' ? `${btnWidth}px` : btnWidth;
      s.minWidth = s.width;
    } else if (width !== undefined) {
      s.width = typeof width === 'number' ? `${width}px` : width;
    } else {
      s.width = 320;
    }
    if (btnHeight !== undefined) {
      s.height = typeof btnHeight === 'number' ? `${btnHeight}px` : btnHeight;
    } else if (height !== undefined && !isMultiline) {
      s.height = typeof height === 'number' ? `${height}px` : height;
    }
    return { ...s, ...sx };
  }, [btnWidth, width, height, btnHeight, sx, isMultiline]);

  const inputCls = `w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] px-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:bg-[#f8f8f8] disabled:border-[var(--color-border)] ${readOnly ? 'bg-[#f5f5f7] border-[#e1e4e8] cursor-default' : ''} ${heightClasses[heightType]}`;

  const showClear = showClearButton && value && !disabled && !readOnly;

  if (isMultiline) {
    return (
      <div style={wrapperStyle} className={className}>
        <div className="relative">
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            className={`${inputCls} h-auto py-2 ${showResizeGrip ? 'resize' : 'resize-none'}`}
            style={height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined}
            {...(customInputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div style={wrapperStyle} className={className}>
      <div className="relative flex items-center">
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${inputCls} ${showClear ? 'pr-8' : ''}`}
          style={wrapperStyle.height ? { height: wrapperStyle.height } : undefined}
          {...customInputProps}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-2 p-0.5 text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const Input = React.memo(InputComponent);

export default Input;
