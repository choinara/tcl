import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { useDateRange } from '@/hooks/useDateRange';
import { DateRangeInput } from '@/components/ui/DateRangeInput';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import { DeleteIconButton } from '@/shared/components/button/DeleteIconButton';
import { UserMemberFilterForm } from '../filter/UserMemberFilterForm';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import type { AdminUser } from '../types/adminUser';


export const UserMemberList = () => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const dateParams = useMemo(() => ({ startDate: dateFrom, endDate: dateTo }), [dateFrom, dateTo]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleDelete = async (record: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await confirmDialog(`사용자 "${record.userName}"을(를) 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${record.userId}`);
      notify('사용자가 삭제되었습니다', { type: 'success' });
      setRefetchTrigger(prev => prev + 1);
    } catch (err: unknown) {
      notify(`삭제 실패: ${err instanceof Error ? err.message : String(err)}`, { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColDef[] = [
    { field: 'userId', headerName: 'No.', width: 60, cellStyle: { textAlign: 'center' } },
    { field: 'loginId', headerName: '사용자ID', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'userName', headerName: '이름', flex: 1, minWidth: 150 },
    { field: 'deptName', headerName: '부서', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'position', headerName: '직급', width: 100, cellStyle: { textAlign: 'center' } },
    { field: 'email', headerName: '이메일', width: 200 },
    { field: 'employeeNumber', headerName: '사번', width: 100, cellStyle: { textAlign: 'center' } },
    { field: 'status', headerName: '상태', width: 80, cellStyle: { textAlign: 'center' } },
    { field: 'roleName', headerName: '역할', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'createDt', headerName: '등록일', width: 100, cellStyle: { textAlign: 'center' } },
    { headerName: '삭제', width: 60, sortable: false, cellRenderer: (p: ICellRendererParams) => <DeleteIconButton onClick={(e: React.MouseEvent) => handleDelete(p.data, e)} disabled={isDeleting} /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="사용자 관리" subtitle="시스템 사용자를 등록하고 관리합니다"
        rightContent={<PrimaryButton heightType="h40" onClick={() => navigate('/system/users/create')}>사용자 등록</PrimaryButton>} />
      <UserMemberFilterForm onSearch={setFilters} />
      <div className="flex-1 flex flex-col min-h-0 mt-1">
        <PeakDataGrid columns={columns} queryKey={['admin-users']} queryUrl="/admin/users" extraParams={{ ...filters, ...dateParams }}
          onRowClick={(row: AdminUser) => navigate(`/system/users/${row.userId}/show`)}
          refetchTrigger={refetchTrigger}
          toolbarLeft={<DateRangeInput dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />} />
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default UserMemberList;
