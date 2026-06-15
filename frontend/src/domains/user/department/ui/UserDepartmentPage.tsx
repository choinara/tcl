import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import { DepartmentTree } from './components/DepartmentTree';
import { DepartmentForm } from './components/DepartmentForm';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import type { Department, DepartmentFormData } from '../types/department';

export const UserDepartmentPage = () => {
  const perm = usePermission('UM0020');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const qc = useQueryClient();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => { const res = await api.get<any>('/admin/departments'); return (res.data ?? []) as Department[]; },
  });

  const { mutate: saveDept, isPending } = useMutation({
    mutationFn: (data: DepartmentFormData & { deptId?: number }) => {
      if (data.deptId) return api.put(`/admin/departments/${data.deptId}`, data);
      return api.post('/admin/departments', data);
    },
    onSuccess: () => {
      notify('부서가 저장되었습니다', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const { mutate: deleteDept } = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/departments/${id}`),
    onSuccess: () => {
      notify('부서가 삭제되었습니다', { type: 'success' });
      setSelectedDept(null);
      qc.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => { notify(`삭제 실패: ${err.message}`, { type: 'error' }); },
  });

  const handleSave = (data: DepartmentFormData) => {
    saveDept({ ...data, deptId: selectedDept?.deptId });
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    if (!await confirmDialog(`부서 "${selectedDept.deptName}"을(를) 삭제하시겠습니까?`)) return;
    deleteDept(selectedDept.deptId);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="부서 관리" subtitle="조직 부서를 관리합니다"
        rightContent={perm.canCreate ? <PrimaryButton heightType="h40" onClick={() => setSelectedDept({ deptId: 0, deptCode: '', deptName: '' } as Department)}>부서 추가</PrimaryButton> : undefined} />
      <div className="flex-1 flex min-h-0 my-1 border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        <div className="w-[300px] border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-auto">
          <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">부서 트리</div>
          <DepartmentTree departments={departments} selectedId={selectedDept?.deptId ?? null} onSelect={setSelectedDept} />
        </div>
        <DepartmentForm department={selectedDept} onSave={handleSave} onDelete={selectedDept?.deptId && perm.canDelete ? handleDelete : undefined} isLoading={isPending || !perm.canUpdate} />
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default UserDepartmentPage;
