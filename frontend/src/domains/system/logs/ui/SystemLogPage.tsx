import { useMemo } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid';
import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

interface SystemLog {
  id: number;
  logType: string;
  username: string;
  ipAddress: string;
  action: string;
  detail: string;
  loggedAt: string;
}

export default function SystemLogPage() {
  const perm = usePermission('SM0060');
  const columns: ColDef<SystemLog>[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 60 },
    {
      field: 'logType',
      headerName: '로그유형',
      width: 100,
      cellRenderer: (p: ICellRendererParams<SystemLog>) => {
        const type = p.value as string;
        const colorMap: Record<string, string> = {
          LOGIN: '#3b82f6',
          LOGOUT: '#6b7280',
          ERROR: '#ef4444',
          INFO: '#10b981',
          WARN: '#f59e0b',
        };
        return (
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 12,
            background: `${colorMap[type] || '#6b7280'}20`,
            color: colorMap[type] || '#6b7280',
            fontWeight: 500,
          }}>
            {type}
          </span>
        );
      },
    },
    { field: 'username', headerName: '사용자', width: 120 },
    { field: 'ipAddress', headerName: 'IP', width: 130 },
    { field: 'action', headerName: '액션', width: 150 },
    {
      field: 'detail',
      headerName: '상세',
      width: 250,
      cellRenderer: (p: ICellRendererParams<SystemLog>) => {
        const detail = p.value as string;
        const truncated = detail && detail.length > 50
          ? detail.substring(0, 50) + '...'
          : detail;
        return <span title={detail}>{truncated}</span>;
      },
    },
    { field: 'loggedAt', headerName: '일시', width: 160 },
  ], []);

  return (
    <div>
      <PeakDataGrid<SystemLog>
        hideRowNumber
        toolbarLeft={
          <>
            <PageTitle />
          </>
        }
        columns={columns}
        queryKey={['system-logs']}
        queryUrl="/system/logs"
        enableSearch
        permission={{ canExport: perm.canExport }}
      />
    </div>
  );
}
