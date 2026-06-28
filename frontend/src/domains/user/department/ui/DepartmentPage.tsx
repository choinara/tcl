import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakDataGrid } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Department {
  id: number;
  deptCode: string;
  deptName: string;
  parentId: number | null;
  companyId: number | null;
  deptLevel: number;
  sortOrder: number;
  managerName: string;
  isActive: boolean;
}

interface DepartmentForm {
  deptCode: string;
  deptName: string;
  parentId: string;
  deptLevel: string;
  sortOrder: string;
  managerName: string;
  active: boolean;
  companyId: string;
}

interface CommonCode {
  code: string;
  codeName: string;
}

interface CompanyItem {
  id: number;
  companyCode: string;
  companyName: string;
}

const emptyForm: DepartmentForm = {
  deptCode: '', deptName: '', parentId: '', deptLevel: '1',
  sortOrder: '0', managerName: '', active: true, companyId: '',
};

export default function DepartmentPage() {
  const perm = usePermission('UM0020');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [levelCodes, setLevelCodes] = useState<CommonCode[]>([]);
  const [deptCodes, setDeptCodes] = useState<CommonCode[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/common-codes/group/DEPT_LEVEL');
        if (res.ok) { const json = await res.json(); setLevelCodes(json.data || []); }
      } catch { notify('부서 조회에 실패했습니다', { type: 'error' }); }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/common-codes/group/DEPT_CODE');
        if (res.ok) { const json = await res.json(); setDeptCodes(json.data || []); }
      } catch { notify('직급 조회에 실패했습니다', { type: 'error' }); }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/organization/companies/all');
        if (res.ok) { const json = await res.json(); setCompanies(json.data || []); }
      } catch { notify('직원 조회에 실패했습니다', { type: 'error' }); }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/organization/departments/all');
        if (res.ok) { const json = await res.json(); setAllDepartments(json.data || []); }
      } catch { notify('데이터 조회에 실패했습니다', { type: 'error' }); }
    })();
  }, [refetchTrigger, notify]);

  const getLevelLabel = useCallback((level: number) => {
    return levelCodes.find(c => c.code === String(level))?.codeName || `L${level}`;
  }, [levelCodes]);

  const getCompanyName = useCallback((companyId: number | null) => {
    if (!companyId) return '';
    return companies.find(c => c.id === companyId)?.companyName || '';
  }, [companies]);

  const getParentName = useCallback((parentId: number | null) => {
    if (!parentId) return '';
    return allDepartments.find(d => d.id === parentId)?.deptName || '';
  }, [allDepartments]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.deptCode) newErrors.deptCode = '부서코드는 필수입니다.';
    if (!form.deptName.trim()) newErrors.deptName = '부서명은 필수입니다.';
    if (!form.deptLevel) newErrors.deptLevel = '부서레벨은 필수입니다.';
    if (!form.parentId) newErrors.parentId = '상위부서는 필수입니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleCreate = useCallback(() => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((dept: Department) => {
    setSelected(dept);
    setForm({
      deptCode: dept.deptCode || '', deptName: dept.deptName || '',
      parentId: dept.parentId != null ? String(dept.parentId) : '',
      deptLevel: String(dept.deptLevel ?? 1), sortOrder: String(dept.sortOrder ?? 0),
      managerName: dept.managerName || '', active: dept.isActive ?? true,
      companyId: dept.companyId != null ? String(dept.companyId) : '',
    });
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isEdit = selected !== null;
      const url = isEdit ? `/api/organization/departments/${selected.id}` : '/api/organization/departments';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...form,
        parentId: form.parentId ? Number(form.parentId) : null,
        deptLevel: Number(form.deptLevel),
        sortOrder: Number(form.sortOrder),
        companyId: form.companyId ? Number(form.companyId) : null,
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
  }, [form, selected, handleClose, validate, notify]);

  const handleDelete = useCallback(async (dept: Department) => {
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/organization/departments/${dept.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      setRefetchTrigger(n => n + 1);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [notify, confirmDialog]);

  const columns = useMemo<ColDef<Department>[]>(() => [
    { field: 'deptCode', headerName: '부서코드', width: 120 },
    { field: 'deptName', headerName: '부서명', width: 150 },
    {
      field: 'companyId', headerName: '소속회사', width: 120,
      valueFormatter: (params) => getCompanyName(params.value),
    },
    {
      field: 'deptLevel', headerName: '레벨', width: 100,
      valueFormatter: (params) => getLevelLabel(params.value),
    },
    {
      field: 'parentId', headerName: '상위부서', width: 130,
      valueFormatter: (params) => getParentName(params.value),
    },
    { field: 'managerName', headerName: '부서장', width: 100 },
    {
      field: 'isActive', headerName: '활성', width: 70,
      valueFormatter: (params) => params.value ? '활성' : '비활성',
    },
    {
      headerName: '관리', width: 120, sortable: false,
      cellRenderer: (params: { data: Department }) => {
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
  ], [perm.canUpdate, perm.canDelete, getCompanyName, getLevelLabel, getParentName, handleEdit, handleDelete]);

  const f = (field: keyof DepartmentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const selectStyle: React.CSSProperties = { width: '100%' };
  const errorSelectStyle: React.CSSProperties = { width: '100%', borderColor: '#ef4444' };
  const errorTextStyle: React.CSSProperties = { fontSize: 12, color: '#ef4444', marginTop: 2 };

  const parentOptions = useMemo(() => {
    let opts = allDepartments.filter(d => !selected || d.id !== selected.id);
    if (form.companyId) {
      opts = opts.filter(d => d.companyId === Number(form.companyId));
    }
    return opts;
  }, [allDepartments, selected, form.companyId]);

  const handleDeptCodeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const found = deptCodes.find(c => c.code === code);
    setForm(prev => ({ ...prev, deptCode: code, deptName: found?.codeName || '' }));
    setErrors(prev => ({ ...prev, deptCode: '', deptName: '' }));
  }, [deptCodes]);

  return (
    <div>
      <PeakDataGrid<Department>
        gridId="departments"
        toolbarLeft={
          <>
            <PageTitle />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" onClick={handleCreate}>신규 등록</button>
            )}
          </>
        }
        columns={columns}
        queryKey={['departments']}
        queryUrl="/organization/departments"
        enableSearch
        refetchTrigger={refetchTrigger}
      />

      <Modal open={modalOpen} onClose={handleClose} title={selected ? '조직 수정' : '조직 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              부서코드<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.deptCode} onChange={handleDeptCodeChange}
              style={errors.deptCode ? errorSelectStyle : selectStyle}>
              <option value="">선택하세요</option>
              {deptCodes.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.codeName}</option>
              ))}
            </select>
            {errors.deptCode && <div style={errorTextStyle}>{errors.deptCode}</div>}
          </div>
          <FormField label="부서명" required value={form.deptName} onChange={f('deptName')} error={errors.deptName} placeholder="부서명을 입력하세요" />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              소속회사
            </label>
            <select value={form.companyId} onChange={(e) => {
              setForm(prev => ({ ...prev, companyId: e.target.value, parentId: '' }));
            }} style={selectStyle}>
              <option value="">선택하세요</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              부서레벨<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.deptLevel} onChange={f('deptLevel')}
              style={errors.deptLevel ? errorSelectStyle : selectStyle}>
              <option value="">선택하세요</option>
              {levelCodes.map(o => <option key={o.code} value={o.code}>{o.codeName}</option>)}
            </select>
            {errors.deptLevel && <div style={errorTextStyle}>{errors.deptLevel}</div>}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              상위부서<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.parentId} onChange={f('parentId')}
              style={errors.parentId ? errorSelectStyle : selectStyle}>
              <option value="">선택하세요</option>
              {parentOptions.map(d => (
                <option key={d.id} value={d.id}>{d.deptName} ({d.deptCode})</option>
              ))}
            </select>
            {errors.parentId && <div style={errorTextStyle}>{errors.parentId}</div>}
          </div>
          <FormField label="부서장명" value={form.managerName} onChange={f('managerName')} />
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
