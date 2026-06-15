import React, { type ReactNode } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children?: ReactNode;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  action?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantConfig: Record<CalloutVariant, { bg: string; border: string; color: string; Icon: typeof Info }> = {
  info: { bg: '#E3F2FD', border: '#2196f3', color: '#1565C0', Icon: Info },
  success: { bg: '#E8F5E9', border: '#4caf50', color: '#2E7D32', Icon: CheckCircle },
  warning: { bg: '#FFF3E0', border: '#ff9800', color: '#E65100', Icon: AlertTriangle },
  error: { bg: '#FFEBEE', border: '#f44336', color: '#C62828', Icon: XCircle },
};

export const Callout = ({
  variant = 'info',
  title,
  children,
  icon,
  closable = false,
  onClose,
  backgroundColor,
  borderColor,
  textColor,
  action,
  className,
  style,
}: CalloutProps) => {
  const config = variantConfig[variant];
  const bg = backgroundColor || config.bg;
  const border = borderColor || config.border;
  const color = textColor || config.color;
  const IconComp = config.Icon;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md ${className ?? ''}`}
      style={{
        backgroundColor: bg,
        borderLeft: `4px solid ${border}`,
        color,
        ...style,
      }}
    >
      <span className="shrink-0">{icon ?? <IconComp size={20} />}</span>
      <div className="flex-1">
        {title && <div className={`font-medium ${children ? 'mb-0.5' : ''}`}>{title}</div>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {closable && (
        <button onClick={onClose} className="shrink-0 p-1 hover:opacity-70 transition-opacity">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Callout;
