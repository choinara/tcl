import type { ReactNode } from 'react';

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary,#6b7280)] whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  );
}
