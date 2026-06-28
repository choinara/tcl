import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import { DropDown } from '@/components/ui/DropDown';
import { useToast } from '@/shared/components/toast/useToast';
import { api } from '@/lib/api';
import type { RoleSummary } from '../types/menuAuth';

interface PermissionRow {
  menuId: number;
  menuName: string;
  menuPath: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
}

export const SystemMenuAuthPage = () => {
  const perm = usePermission('SM0020');
  const { notify } = useToast();
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const { data: roles = [] } = useQuery({
    queryKey: ['menu-auth-roles'],
    queryFn: async () => { const res = await api.get<RoleSummary[]>('/admin/roles'); return (res.data ?? []) as RoleSummary[]; },
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['menu-auth-permissions', selectedRoleId],
    queryFn: async () => { const res = await api.get<PermissionRow[]>(`/system/menu-auth/${selectedRoleId}`); return (res.data ?? []) as PermissionRow[]; },
    enabled: !!selectedRoleId,
  });

  const [localPerms, setLocalPerms] = useState<PermissionRow[]>([]);
  const displayPerms = localPerms.length > 0 ? localPerms : permissions;

  const { mutate: savePerms, isPending } = useMutation({
    mutationFn: (data: { roleId: string; permissions: PermissionRow[] }) =>
      api.put(`/system/menu-auth/${data.roleId}`, { permissions: data.permissions }),
    onSuccess: () => {
      notify('메뉴 권한이 저장되었습니다', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['menu-auth-permissions'] });
    },
    onError: (err: Error) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const handleToggle = (idx: number, field: 'read' | 'write' | 'delete' | 'approve') => {
    const newPerms = [...(localPerms.length > 0 ? localPerms : permissions)];
    newPerms[idx] = { ...newPerms[idx], [field]: !newPerms[idx][field] };
    setLocalPerms(newPerms);
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    savePerms({ roleId: selectedRoleId, permissions: displayPerms });
  };

  const roleOptions = roles.map((r: RoleSummary) => ({ value: String(r.roleId), label: r.roleName }));

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="메뉴권한관리" subtitle="역할별 메뉴 접근 권한을 관리합니다"
        rightContent={
          perm.canUpdate ? (
            <PrimaryButton heightType="h40" onClick={handleSave} disabled={isPending || !selectedRoleId}>
              {isPending ? '저장 중...' : '저장'}
            </PrimaryButton>
          ) : undefined
        }
      />
      <div className="px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">역할 선택</span>
          <DropDown options={roleOptions} value={selectedRoleId} onChange={(e) => { setSelectedRoleId(String(e.target.value)); setLocalPerms([]); }} heightType="h32" placeholder="역할을 선택하세요" />
        </div>
      </div>

      <div className="flex-1 overflow-auto my-1">
        {!selectedRoleId ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-secondary)]">
            상단에서 역할을 선택하면 메뉴별 권한 설정이 표시됩니다.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2.5 font-medium">메뉴명</th>
                <th className="text-left px-4 py-2.5 font-medium w-[200px]">경로</th>
                <th className="text-center px-4 py-2.5 font-medium w-[80px]">읽기</th>
                <th className="text-center px-4 py-2.5 font-medium w-[80px]">쓰기</th>
                <th className="text-center px-4 py-2.5 font-medium w-[80px]">삭제</th>
                <th className="text-center px-4 py-2.5 font-medium w-[80px]">승인</th>
              </tr>
            </thead>
            <tbody>
              {displayPerms.map((row, idx) => (
                <tr key={row.menuId} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]">
                  <td className="px-4 py-2">{row.menuName}</td>
                  <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.menuPath}</td>
                  <td className="text-center px-4 py-2">
                    <input type="checkbox" checked={row.read} onChange={() => handleToggle(idx, 'read')} className="w-4 h-4" />
                  </td>
                  <td className="text-center px-4 py-2">
                    <input type="checkbox" checked={row.write} onChange={() => handleToggle(idx, 'write')} className="w-4 h-4" />
                  </td>
                  <td className="text-center px-4 py-2">
                    <input type="checkbox" checked={row.delete} onChange={() => handleToggle(idx, 'delete')} className="w-4 h-4" />
                  </td>
                  <td className="text-center px-4 py-2">
                    <input type="checkbox" checked={row.approve} onChange={() => handleToggle(idx, 'approve')} className="w-4 h-4" />
                  </td>
                </tr>
              ))}
              {displayPerms.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--color-text-secondary)]">
                    해당 역할의 메뉴 권한 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SystemMenuAuthPage;
