import { useState, useCallback, useMemo } from 'react';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakDataGrid } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description: string;
}

interface RoleForm {
  roleCode: string;
  roleName: string;
  description: string;
}

const emptyForm: RoleForm = { roleCode: '', roleName: '', description: '' };

export default function RoleManagementPage() {
  const perm = usePermission('SM0030');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editingId && !form.roleCode.trim()) newErrors.roleCode = '역할코드를 입력하세요.';
    if (!form.roleName.trim()) newErrors.roleName = '역할명을 입력하세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, editingId]);

  const handleNew = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((role: Role) => {
    setEditingId(role.id);
    setForm({ roleCode: role.roleCode, roleName: role.roleName, description: role.description ?? '' });
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/system/roles/${editingId}` : '/api/system/roles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || '요청 처리에 실패했습니다.');
      }
      setModalOpen(false);
      setRefetchTrigger(n => n + 1);
      notify(editingId ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, editingId, validate, notify]);

  const handleDelete = useCallback(async (role: Role) => {
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/system/roles/${role.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || '요청 처리에 실패했습니다.');
      }
      setRefetchTrigger(n => n + 1);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [confirmDialog, notify]);

  const columns = useMemo<ColDef<Role>[]>(() => [
    { field: 'roleCode', headerName: '역할코드', width: 160 },
    { field: 'roleName', headerName: '역할명', width: 200 },
    { field: 'description', headerName: '설명', flex: 1 },
    {
      headerName: '관리', width: 120, sortable: false,
      cellRenderer: (params: { data: Role }) => {
        if (!params.data) return null;
        return (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {perm.canUpdate && (
              <button onClick={() => handleEdit(params.data)}
                className="mes-btn mes-btn-edit" style={{ padding: '2px 8px', fontSize: 12 }}>수정</button>
            )}
            {perm.canDelete && (
              <button onClick={() => handleDelete(params.data)}
                className="mes-btn mes-btn-delete" style={{ padding: '2px 8px', fontSize: 12 }}>삭제</button>
            )}
          </div>
        );
      },
    },
  ], [perm.canUpdate, perm.canDelete, handleEdit, handleDelete]);

  return (
    <div>
      <PeakDataGrid<Role>
        gridId="system-roles"
        toolbarLeft={
          <>
            <PageTitle />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" onClick={handleNew}>역할 추가</button>
            )}
          </>
        }
        columns={columns}
        queryKey={['system-roles']}
        queryUrl="/system/roles"
        enableSearch
        refetchTrigger={refetchTrigger}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? '역할 수정' : '역할 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <FormField label="역할코드" required value={form.roleCode}
            onChange={(e) => setForm(prev => ({ ...prev, roleCode: e.target.value.toUpperCase() }))}
            placeholder="SUPER_ADMIN, MANAGER, ..." disabled={!!editingId} error={errors.roleCode} />
          <FormField label="역할명" required value={form.roleName}
            onChange={(e) => setForm(prev => ({ ...prev, roleName: e.target.value }))}
            placeholder="최고관리자, 매니저, ..." error={errors.roleName} />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="설명" value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="역할 설명" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={() => setModalOpen(false)}
            style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            취소
          </button>
          {(editingId ? perm.canUpdate : perm.canCreate) && (
            <button onClick={handleSave} disabled={saving}
              className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>
      <ConfirmDialog />
    </div>
  );
}
