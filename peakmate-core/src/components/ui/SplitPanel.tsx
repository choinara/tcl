import { type ReactNode } from 'react';

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
  height?: string;
}

export function SplitPanel({ left, right, leftWidth = '45%', height = 'calc(100vh - 120px)' }: SplitPanelProps) {
  return (
    <div style={{ display: 'flex', gap: 16, height, minHeight: 0 }}>
      <div style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {left}
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {right}
      </div>
    </div>
  );
}
