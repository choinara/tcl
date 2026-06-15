import React from 'react';

export interface ChipContainerProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number | string;
}

const ChipContainerComponent = ({ children, className, style, minHeight = 80 }: ChipContainerProps) => {
  return (
    <div
      className={`relative flex flex-wrap gap-2 p-2 px-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md ${className ?? ''}`}
      style={{ minHeight, ...style }}
    >
      {children}
      <span
        className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none"
        style={{
          background: 'linear-gradient(-45deg, transparent 0px, transparent 4px, #ccc 4px, #ccc 5px, transparent 5px, transparent 8px, #ccc 8px, #ccc 9px, transparent 9px)',
        }}
      />
    </div>
  );
};

export const ChipContainer = React.memo(ChipContainerComponent);

export default ChipContainer;
