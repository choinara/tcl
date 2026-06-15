import React from 'react';
import { X } from 'lucide-react';
import type { BadgeStyleConfig } from '../../types/badgeStyle';

interface CustomChipProps {
  label?: string;
  onDelete?: () => void;
  chipBgColor?: string;
  chipTextColor?: string;
  chipBorderColor?: string;
  styleConfig?: BadgeStyleConfig;
  styleVariant?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomChip = ({
  label,
  onDelete,
  chipBgColor,
  chipTextColor,
  chipBorderColor,
  styleConfig,
  styleVariant,
  className,
  style,
}: CustomChipProps) => {
  let bgColor = '#F0F2F7';
  let textColor = 'var(--color-text-primary)';
  let borderColor = 'var(--color-border)';

  if (styleConfig) {
    const configKey = styleVariant || Object.keys(styleConfig)[0];
    const configStyle = styleConfig[configKey];
    if (configStyle) {
      bgColor = configStyle.bgColor || bgColor;
      textColor = configStyle.textColor || textColor;
      borderColor = configStyle.borderColor || borderColor;
    }
  }

  bgColor = chipBgColor || bgColor;
  textColor = chipTextColor || textColor;
  borderColor = chipBorderColor || borderColor;

  return (
    <span
      className={`inline-flex items-center h-7 text-sm rounded px-2.5 ${className ?? ''}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        ...style,
      }}
    >
      <span>{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="ml-1 hover:opacity-70 transition-opacity"
          style={{ color: textColor }}
        >
          <X size={16} />
        </button>
      )}
    </span>
  );
};

export default CustomChip;
