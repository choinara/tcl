import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton, GhostButton } from '@/shared/components/button/CustomButton';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { api } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import type { RoleInfo } from '../types/userRole';

export const UserRolePage = () => {
  const perm = usePermission('SM0030');
  const { notify } = useToast();
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { data: roles = [] } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => { const res = await api.get<any>('/admin/roles'); return (res.data?.content ?? res.data ?? []) as RoleInfo[]; },
  });

  const { mutate: assignUsers, isPending } = useMutation({
    mutationFn: (data: { roleId: number; userIds: number[] }) =>
      api.put(`/admin/roles/${data.roleId}/users`, { userIds: data.userIds }),
    onSuccess: () => {
      notify('권한이 저장되었습니다', { type: 'success' });
      setRefetchTrigger(prev => prev + 1);
    },
    onError: (err: any) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const userColumns: ColDef[] = [
    { field: 'userId', headerName: 'No.', width: 60, cellStyle: { textAlign: 'center' } },
    { field: 'loginId', headerName: '사용자ID', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'userName', headerName: '이름', flex: 1, minWidth: 150 },
    { field: 'deptName', headerName: '부서', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'assigned', headerName: '할당', width: 80, cellStyle: { textAlign: 'center' },
      valueFormatter: (p: any) => p.value ? 'Y' : 'N' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="권한 관리" subtitle="역할별 사용자를 할당하고 관리합니다" />
      <div className="flex-1 flex min-h-0 my-1 gap-2.5">
        {/* Left: Role List */}
        <div className="w-[280px] border border-[var(--color-border)] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold bg-[var(--color-bg-secondary)]">역할 목록</div>
          <div className="flex-1 overflow-auto">
            {roles.map((role: RoleInfo) => (
              <div
                key={role.roleId}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-[var(--color-border)] transition-colors ${selectedRole?.roleId === role.roleId ? 'bg-[var(--color-primary)] bg-opacity-10' : 'hover:bg-[var(--color-bg-hover)]'}`}
                onClick={() => setSelectedRole(role)}
              >
                <div>
                  <div className="text-sm font-medium">{role.roleName}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{role.roleCode}</div>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)]">{role.userCount ?? 0}명</span>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="p-4 text-sm text-[var(--color-text-secondary)]">등록된 역할이 없습니다.</div>
            )}
          </div>
        </div>

        {/* Right: User Grid */}
        <div className="flex-1 border border-[var(--color-border)] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold bg-[var(--color-bg-secondary)] flex justify-between items-center">
            <span>{selectedRole ? `${selectedRole.roleName} - 사용자 목록` : '역할을 선택하세요'}</span>
            {selectedRole && perm.canUpdate && (
              <PrimaryButton heightType="h32" onClick={() => { if (selectedRole) assignUsers({ roleId: selectedRole.roleId, userIds: [] }); }} disabled={isPending}>
                저장
              </PrimaryButton>
            )}
          </div>
          {selectedRole ? (
            <div className="flex-1 flex flex-col min-h-0 p-2.5">
              <PeakDataGrid columns={userColumns} queryKey={['role-users', selectedRole.roleId]} queryUrl={`/admin/roles/${selectedRole.roleId}/users`} refetchTrigger={refetchTrigger} permission={{ canExport: perm.canExport }} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
              좌측에서 역할을 선택하면 해당 역할의 사용자 목록이 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRolePage;
