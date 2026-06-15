import { useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { PageHeader } from '@/shared/components/header';
import { SystemLogFilterForm } from '../filter/SystemLogFilterForm';

export const SystemLogList = () => {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const columns: ColDef[] = [
    { field: 'logId', headerName: 'No.', width: 60, cellStyle: { textAlign: 'center' } },
    { field: 'logType', headerName: '로그유형', width: 100, cellStyle: { textAlign: 'center' } },
    { field: 'userName', headerName: '사용자', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'loginId', headerName: '사용자ID', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'action', headerName: '액션', width: 150 },
    { field: 'detail', headerName: '상세', flex: 1, minWidth: 300 },
    { field: 'ipAddress', headerName: 'IP주소', width: 130, cellStyle: { textAlign: 'center' } },
    { field: 'loggedAt', headerName: '일시', width: 160, cellStyle: { textAlign: 'center' } },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="시스템 로그" subtitle="시스템 활동 로그를 조회합니다" />
      <SystemLogFilterForm onSearch={setFilters} />
      <div className="flex-1 flex flex-col min-h-0 mt-1">
        <PeakDataGrid columns={columns} queryKey={['system-logs']} queryUrl="/system/logs" extraParams={filters} />
      </div>
    </div>
  );
};

export default SystemLogList;
