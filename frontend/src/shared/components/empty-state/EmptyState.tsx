import React from 'react';

interface EmptyStateProps {
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState = ({ message = '조회된 데이터가 없습니다', className, style }: EmptyStateProps) => (
  <div
    className={`py-12 text-center text-[var(--color-text-secondary)] text-[13px] ${className ?? ''}`}
    style={style}
  >
    {message}
  </div>
);

export default EmptyState;
