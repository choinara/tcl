import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { authFetch } from '@/lib/api';
import { useCommonCodes, getCodeName } from '@/hooks/useCommonCodes';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakDataGrid } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Position {
  id: number;
  positionCode: string;
  positionName: string;
  positionLevel: number;
  sortOrder: number;
  isActive: boolean;
}

interface PositionForm {
  positionCode: string;
  positionName: string;
  positionLevel: string;
  autoRole: string;
  sortOrder: string;
  active: boolean;
}

const emptyForm: PositionForm = {
  positionCode: '', positionName: '', positionLevel: '6',
  autoRole: 'VIEWER', sortOrder: '0', active: true,
};

const selectStyle: React.CSSProperties = { width: '100%' };

export default function PositionPage() {
  const perm = usePermission('UM0040');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Position | null>(null);
  const [form, setForm] = useState<PositionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const codes = useCommonCodes('POS_LEVEL', 'USER_ROLE');

  const columns = useMemo<ColDef<Position>[]>(() => [
    { field: 'positionCode', headerName: '직급코드', width: 120 },
    { field: 'positionName', headerName: '직급명', width: 140 },
    {
      field: 'positionLevel', headerName: '레벨', width: 100,
      valueFormatter: (params) => getCodeName(codes['POS_LEVEL'], String(params.value)),
    },
    { field: 'sortOrder', headerName: '정렬', width: 80 },
    {
      field: 'isActive', headerName: '활성', width: 80,
      valueFormatter: (params) => params.value ? '활성' : '비활성',
    },
    {
      headerName: '관리', width: 120, sortable: false,
      cellRenderer: (params: { data: Position }) => {
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
  ], [perm.canUpdate, perm.canDelete, codes]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.positionCode.trim()) newErrors.positionCode = '직급코드를 입력하세요.';
    if (!form.positionName.trim()) newErrors.positionName = '직급명을 입력하세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleCreate = useCallback(() => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((pos: Position) => {
    setSelected(pos);
    setForm({
      positionCode: pos.positionCode || '', positionName: pos.positionName || '',
      positionLevel: String(pos.positionLevel ?? 6), autoRole: 'VIEWER',
      sortOrder: String(pos.sortOrder ?? 0), active: pos.isActive ?? true,
    });
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSelected(null);
    setForm(emptyForm);
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isEdit = selected !== null;
      const url = isEdit ? `/api/organization/positions/${selected.id}` : '/api/organization/positions';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...form,
        positionLevel: Number(form.positionLevel),
        sortOrder: Number(form.sortOrder),
        isActive: form.active,
      };
      const res = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      setRefetchTrigger(n => n + 1);
      notify(isEdit ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      handleClose();
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, selected, handleClose, validate]);

  const handleDelete = useCallback(async (pos: Position) => {
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/organization/positions/${pos.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      setRefetchTrigger(n => n + 1);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [notify]);

  const f = (field: keyof PositionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      <PeakDataGrid<Position>
        gridId="positions"
        toolbarLeft={
          <>
            <PageTitle />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" onClick={handleCreate}>신규 등록</button>
            )}
          </>
        }
        columns={columns}
        queryKey={['positions']}
        queryUrl="/organization/positions"
        enableSearch
        refetchTrigger={refetchTrigger}
      />

      <Modal open={modalOpen} onClose={handleClose} title={selected ? '직급 수정' : '직급 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <FormField label="직급코드" required value={form.positionCode} onChange={f('positionCode')} error={errors.positionCode} />
          <FormField label="직급명" required value={form.positionName} onChange={f('positionName')} error={errors.positionName} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              레벨<span style={{ color: '#3b82f6', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.positionLevel} onChange={f('positionLevel')} style={selectStyle}>
              {(codes['POS_LEVEL'] || []).map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              자동매핑역할<span style={{ color: '#3b82f6', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.autoRole} onChange={f('autoRole')} style={selectStyle}>
              {(codes['USER_ROLE'] || []).map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#374151' }}>
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} />
              활성
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={handleClose}
            style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            취소
          </button>
          {(selected ? perm.canUpdate : perm.canCreate) && (
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
