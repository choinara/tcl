import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/shared/components/header';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import { MenuTree } from './components/MenuTree';
import { MenuForm } from './components/MenuForm';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import type { Menu, MenuFormData } from '../types/menu';

export const SystemMenuPage = () => {
  const perm = usePermission('SM0010');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const qc = useQueryClient();
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const { data: menus = [] } = useQuery({
    queryKey: ['system-menus'],
    queryFn: async () => { const res = await api.get<Menu[]>('/system/menus'); return (res.data ?? []) as Menu[]; },
  });

  const { mutate: saveMenu, isPending } = useMutation({
    mutationFn: (data: MenuFormData & { menuId?: number }) => {
      if (data.menuId) return api.put(`/system/menus/${data.menuId}`, data);
      return api.post('/system/menus', data);
    },
    onSuccess: () => {
      notify('메뉴가 저장되었습니다', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['system-menus'] });
    },
    onError: (err: Error) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const { mutate: deleteMenu } = useMutation({
    mutationFn: (id: number) => api.delete(`/system/menus/${id}`),
    onSuccess: () => {
      notify('메뉴가 삭제되었습니다', { type: 'success' });
      setSelectedMenu(null);
      qc.invalidateQueries({ queryKey: ['system-menus'] });
    },
    onError: (err: Error) => { notify(`삭제 실패: ${err.message}`, { type: 'error' }); },
  });

  const handleSave = (data: MenuFormData) => {
    saveMenu({ ...data, menuId: selectedMenu?.menuId });
  };

  const handleDelete = async () => {
    if (!selectedMenu) return;
    if (!await confirmDialog(`메뉴 "${selectedMenu.menuName}"을(를) 삭제하시겠습니까?`)) return;
    deleteMenu(selectedMenu.menuId);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <PageHeader title="메뉴 관리" subtitle="시스템 메뉴를 관리합니다"
        rightContent={perm.canCreate ? <PrimaryButton heightType="h40" onClick={() => setSelectedMenu({ menuId: 0, menuCode: '', menuName: '' } as Menu)}>메뉴 추가</PrimaryButton> : undefined} />
      <div className="flex-1 flex min-h-0 my-1 border border-[var(--color-border)] rounded-[10px] overflow-hidden">
        <div className="w-[300px] border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-auto">
          <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm font-semibold">메뉴 트리</div>
          <MenuTree menus={menus} selectedId={selectedMenu?.menuId ?? null} onSelect={setSelectedMenu} />
        </div>
        <MenuForm menu={selectedMenu} onSave={handleSave} onDelete={selectedMenu?.menuId && perm.canDelete ? handleDelete : undefined} isLoading={isPending || !perm.canUpdate} />
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default SystemMenuPage;
