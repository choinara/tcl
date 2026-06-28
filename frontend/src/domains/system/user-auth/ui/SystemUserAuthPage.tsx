import { useState, type KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import Input from '@/shared/components/input/Input';
import { FilterSearchButton } from '@/shared/components/button/CustomButton';
import { useToast } from '@/shared/components/toast/useToast';
import { api } from '@/lib/api';
import type { MenuException } from '../types/userAuth';

interface UserRow {
  userId: number;
  loginId: string;
  userName: string;
  deptName?: string;
}

type SelectedUser = Pick<UserRow, 'userId' | 'loginId' | 'userName'>;

export const SystemUserAuthPage = () => {
  const perm = usePermission('SM0050');
  const { notify } = useToast();
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const { data: exceptions = [] } = useQuery({
    queryKey: ['user-auth-exceptions', selectedUser?.userId],
    queryFn: async () => { const res = await api.get<MenuException[]>(`/system/user-auth/${selectedUser!.userId}`); return (res.data ?? []) as MenuException[]; },
    enabled: !!selectedUser,
  });

  const [localExceptions, setLocalExceptions] = useState<MenuException[]>([]);
  const displayExceptions = localExceptions.length > 0 ? localExceptions : exceptions;

  const { mutate: saveExceptions, isPending } = useMutation({
    mutationFn: (data: { userId: number; exceptions: MenuException[] }) =>
      api.put(`/system/user-auth/${data.userId}`, { exceptions: data.exceptions }),
    onSuccess: () => {
      notify('예외권한이 저장되었습니다', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['user-auth-exceptions'] });
    },
    onError: (err: Error) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const handleToggle = (idx: number, field: 'read' | 'write' | 'delete') => {
    const newExceptions = [...(localExceptions.length > 0 ? localExceptions : exceptions)];
    newExceptions[idx] = { ...newExceptions[idx], [field]: !newExceptions[idx][field] };
    setLocalExceptions(newExceptions);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    saveExceptions({ userId: selectedUser.userId, exceptions: displayExceptions });
  };

  const userColumns: ColDef[] = [
    { field: 'userId', headerName: 'No.', width: 60, cellStyle: { textAlign: 'center' } },
    { field: 'loginId', headerName: '사용자ID', width: 120, cellStyle: { textAlign: 'center' } },
    { field: 'userName', headerName: '이름', flex: 1, minWidth: 120 },
    { field: 'deptName', headerName: '부서', width: 100, cellStyle: { textAlign: 'center' } },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="예외권한부여" subtitle="특정 사용자에게 역할과 별개로 예외 권한을 부여합니다"
        rightContent={
          perm.canUpdate ? (
            <PrimaryButton heightType="h40" onClick={handleSave} disabled={isPending || !selectedUser}>
              {isPending ? '저장 중...' : '저장'}
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="flex-1 flex min-h-0 my-1 gap-2.5">
        {/* Left: User search & selection */}
        <div className="w-[350px] border border-[var(--color-border)] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex gap-1">
              <Input value={keyword} onChange={(v: string) => setKeyword(v)} placeholder="사용자 검색" heightType="h32" style={{ flex: 1 }}
                onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && setKeyword(keyword)} />
              <FilterSearchButton onClick={() => setKeyword(keyword)} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <PeakDataGrid columns={userColumns} queryKey={['user-auth-users', keyword]} queryUrl="/admin/users" extraParams={{ keyword }}
              permission={{ canExport: perm.canExport }}
              onRowClick={(row: UserRow) => { setSelectedUser({ userId: row.userId, loginId: row.loginId, userName: row.userName }); setLocalExceptions([]); }} />
          </div>
        </div>

        {/* Right: Permission matrix */}
        <div className="flex-1 border border-[var(--color-border)] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm font-semibold">
            {selectedUser ? `${selectedUser.userName} (${selectedUser.loginId}) - 예외권한` : '사용자를 선택하세요'}
          </div>

          {selectedUser ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-2.5 font-medium">메뉴명</th>
                    <th className="text-center px-4 py-2.5 font-medium w-[80px]">읽기</th>
                    <th className="text-center px-4 py-2.5 font-medium w-[80px]">쓰기</th>
                    <th className="text-center px-4 py-2.5 font-medium w-[80px]">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {displayExceptions.map((exc, idx) => (
                    <tr key={exc.menuId} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]">
                      <td className="px-4 py-2">{exc.menuName}</td>
                      <td className="text-center px-4 py-2">
                        <input type="checkbox" checked={exc.read} onChange={() => handleToggle(idx, 'read')} className="w-4 h-4" />
                      </td>
                      <td className="text-center px-4 py-2">
                        <input type="checkbox" checked={exc.write} onChange={() => handleToggle(idx, 'write')} className="w-4 h-4" />
                      </td>
                      <td className="text-center px-4 py-2">
                        <input type="checkbox" checked={exc.delete} onChange={() => handleToggle(idx, 'delete')} className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                  {displayExceptions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[var(--color-text-secondary)]">
                        해당 사용자의 예외 권한 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
              좌측에서 사용자를 선택하면 예외 권한 설정이 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemUserAuthPage;
