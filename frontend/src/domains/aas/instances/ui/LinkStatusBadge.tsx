import React from 'react';
import type { CustomCellRendererProps } from 'ag-grid-react';

type LinkStatus = 'LINKED' | 'STANDALONE' | 'BROKEN';

const STYLES: Record<LinkStatus, string> = {
  LINKED:     'bg-blue-100 text-blue-700',
  STANDALONE: 'bg-gray-100 text-gray-500',
  BROKEN:     'bg-red-100 text-red-600',
};
const LABELS: Record<LinkStatus, string> = {
  LINKED:     '연결됨',
  STANDALONE: '미연결',
  BROKEN:     '끊김',
};

export function LinkStatusBadge(props: CustomCellRendererProps) {
  const status = (props.value ?? 'STANDALONE') as LinkStatus;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STYLES[status] ?? STYLES.STANDALONE}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
