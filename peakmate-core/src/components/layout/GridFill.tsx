import type { ReactNode, CSSProperties } from 'react';

interface GridFillProps {
  children?: ReactNode;
  gap?: number;
  hidden?: boolean;
}

const baseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
};

export function GridFill({ children, gap, hidden }: GridFillProps) {
  const style: CSSProperties = hidden
    ? { ...baseStyle, display: 'none' }
    : gap != null ? { ...baseStyle, gap } : baseStyle;
  return <div style={style}>{children}</div>;
}
