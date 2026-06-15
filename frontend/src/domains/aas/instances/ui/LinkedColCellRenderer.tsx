import React from 'react';
import type { CustomCellRendererProps } from 'ag-grid-react';

interface Props extends CustomCellRendererProps {
  index: number;
}

export function LinkedColCellRenderer(props: Props) {
  const cols = (props.data as Record<string, unknown> | undefined)?.linkedColumns as
    Array<{ value?: string; label?: string }> | undefined;
  const entry = cols?.[props.index];
  if (!entry?.value) return <span className="text-gray-300">—</span>;
  return (
    <span title={entry.label ?? ''} className="text-sm">
      {entry.value}
      {entry.label && (
        <span className="ml-1 text-gray-400 text-xs">({entry.label})</span>
      )}
    </span>
  );
}
