import React from 'react';
import type { CustomCellRendererProps } from 'ag-grid-react';

interface Props extends CustomCellRendererProps {
  onOpenLink: (row: Record<string, unknown>) => void;
}

export function LinkButtonCell(props: Props) {
  const row = props.data as Record<string, unknown> | undefined;
  if (!row) return null;
  const isLinked = row.linkStatus === 'LINKED' || row.linkStatus === 'BROKEN';
  const cls = isLinked
    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    : 'bg-blue-100 text-blue-700 hover:bg-blue-200';
  return (
    <button
      className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${cls}`}
      onClick={(e) => { e.stopPropagation(); props.onOpenLink(row); }}
    >
      {isLinked ? '재연결' : '연결'}
    </button>
  );
}
