import React from 'react';
import {
  productionStatusStyles,
  productionPriorityStyles,
  productionDifficultyStyles,
  type BadgeStyleConfig,
} from '../../constants/badgeStyles/default';

type BadgeVariantType = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSizeType = 'xs' | 'small' | 'medium' | 'large' | 'base';

interface CustomBadgeProps {
  variant?: BadgeVariantType;
  size?: BadgeSizeType;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  width?: string | number;
  height?: string | number;
  styleConfig?: BadgeStyleConfig;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}

const defaultStyles: Record<BadgeVariantType, { bgColor: string; textColor: string; borderColor: string }> = {
  default: { bgColor: '#F5F5F5', textColor: '#222222', borderColor: '#E0E0E0' },
  success: { bgColor: '#E8F5E9', textColor: '#2E7D32', borderColor: '#4caf50' },
  warning: { bgColor: '#FFF3E0', textColor: '#E65100', borderColor: '#ff9800' },
  error: { bgColor: '#FFEBEE', textColor: '#C62828', borderColor: '#f44336' },
  info: { bgColor: '#E3F2FD', textColor: '#1565C0', borderColor: '#2196f3' },
};

const sizePx: Record<BadgeSizeType, { h: number; text: string; px: string }> = {
  base: { h: 20, text: 'text-[13px]', px: 'px-1.5' },
  xs: { h: 20, text: 'text-[11px]', px: 'px-1.5' },
  small: { h: 24, text: 'text-xs', px: 'px-2' },
  medium: { h: 32, text: 'text-[13px]', px: 'px-3' },
  large: { h: 40, text: 'text-sm', px: 'px-4' },
};

export const CustomBadge = ({
  variant = 'default',
  size = 'small',
  label,
  backgroundColor,
  textColor,
  borderColor,
  width,
  height,
  styleConfig,
  className,
  style,
  icon,
}: CustomBadgeProps) => {
  const styles = styleConfig || defaultStyles;
  const s = (styles as any)[variant] || defaultStyles[variant];
  const bgColor = backgroundColor || s?.bgColor || '#F5F5F5';
  const txtColor = textColor || s?.textColor || '#222';
  const sz = sizePx[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap ${sz.text} ${sz.px} ${className ?? ''}`}
      style={{
        backgroundColor: bgColor,
        color: txtColor,
        height: height ?? sz.h,
        width,
        ...style,
      }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </span>
  );
};

export const DefaultBadge = (props: Omit<CustomBadgeProps, 'variant'>) => <CustomBadge variant="default" {...props} />;
export const SuccessBadge = (props: Omit<CustomBadgeProps, 'variant'>) => <CustomBadge variant="success" {...props} />;
export const WarningBadge = (props: Omit<CustomBadgeProps, 'variant'>) => <CustomBadge variant="warning" {...props} />;
export const ErrorBadge = (props: Omit<CustomBadgeProps, 'variant'>) => <CustomBadge variant="error" {...props} />;
export const InfoBadge = (props: Omit<CustomBadgeProps, 'variant'>) => <CustomBadge variant="info" {...props} />;

interface ProductionBadgeProps {
  value?: string;
  size?: BadgeSizeType;
  width?: string | number;
  height?: string | number;
}

export const ProductionStatusBadge = ({ value, width, height }: ProductionBadgeProps) => {
  const s = productionStatusStyles[value || ''] ?? { bgColor: '#F2F3F4', textColor: '#717D7E', borderColor: 'none' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[13px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bgColor, color: s.textColor, border: `1px solid ${s.borderColor}`, width, height }}
    >
      {value}
    </span>
  );
};

export const ProductionPriorityBadge = ({ value, width, height }: ProductionBadgeProps) => {
  const s = productionPriorityStyles[value || ''] ?? { bgColor: '#F2F3F4', textColor: '#717D7E', borderColor: 'none' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[13px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bgColor, color: s.textColor, border: `1px solid ${s.borderColor}`, width, height }}
    >
      {value}
    </span>
  );
};

export const ProductionDifficultyBadge = ({ value, width, height }: ProductionBadgeProps) => {
  const s = productionDifficultyStyles[value || ''] ?? { bgColor: '#F2F3F4', textColor: '#9E9E9E', borderColor: 'none' };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[13px] font-medium"
      style={{ backgroundColor: s.bgColor, color: s.textColor, width: width ?? 28, height: height ?? 25 }}
    >
      {value}
    </span>
  );
};

export default CustomBadge;
