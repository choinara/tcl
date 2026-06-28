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

interface Company {
  id: number;
  companyCode: string;
  companyName: string;
  companyType: string;
  parentId: number | null;
  country: string;
  address: string;
  phone: string;
  fax: string;
  ceoName: string;
  businessNumber: string;
  isActive: boolean;
}

interface CompanyForm {
  companyCode: string;
  companyName: string;
  companyType: string;
  parentId: string;
  country: string;
  address: string;
  phone: string;
  fax: string;
  ceoName: string;
  businessNumber: string;
  sortOrder: string;
  active: boolean;
}

interface TypeCode {
  code: string;
  codeName: string;
}

const emptyForm: CompanyForm = {
  companyCode: '', companyName: '', companyType: 'HQ', parentId: '',
  country: '', address: '', phone: '', fax: '',
  ceoName: '', businessNumber: '', sortOrder: '0', active: true,
};

export default function CompanyPage() {
  const perm = usePermission('UM0030');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [typeCodes, setTypeCodes] = useState<TypeCode[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/common-codes/group/COMPANY_TYPE');
        if (res.ok) {
          const json = await res.json();
          setTypeCodes(json.data || []);
        }
      } catch { notify('업체 조회에 실패했습니다', { type: 'error' }); }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/organization/companies/all');
        if (res.ok) {
          const json = await res.json();
          setAllCompanies(json.data || []);
        }
      } catch { notify('데이터 조회에 실패했습니다', { type: 'error' }); }
    })();
  }, [refetchTrigger, notify]);

  const getTypeLabel = useCallback((type: string) => {
    return typeCodes.find(c => c.code === type)?.codeName || type;
  }, [typeCodes]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.companyCode.trim()) newErrors.companyCode = '회사코드는 필수입니다.';
    if (!form.companyName.trim()) newErrors.companyName = '회사명은 필수입니다.';
    if (!form.businessNumber.trim()) {
      newErrors.businessNumber = '사업자번호는 필수입니다.';
    } else if (!/^\d{10}$/.test(form.businessNumber)) {
      newErrors.businessNumber = '사업자번호는 숫자 10자리여야 합니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleNew = useCallback(() => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((company: Company) => {
    setSelected(company);
    setForm({
      companyCode: company.companyCode || '',
      companyName: company.companyName || '',
      companyType: company.companyType || 'HQ',
      parentId: company.parentId != null ? String(company.parentId) : '',
      country: company.country || '',
      address: company.address || '',
      phone: company.phone || '',
      fax: company.fax || '',
      ceoName: company.ceoName || '',
      businessNumber: company.businessNumber || '',
      sortOrder: '0',
      active: company.isActive ?? true,
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
      const url = isEdit ? `/api/organization/companies/${selected.id}` : '/api/organization/companies';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...form,
        parentId: form.parentId ? Number(form.parentId) : null,
        sortOrder: Number(form.sortOrder),
        isActive: form.active,
      };
      const res = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(errJson?.message || '요청 처리에 실패했습니다.');
      }
      setRefetchTrigger(n => n + 1);
      notify(isEdit ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      handleClose();
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, selected, handleClose, validate, notify]);

  const handleDelete = useCallback(async (company: Company) => {
    if (!await confirmDialog('삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/organization/companies/${company.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(errJson?.message || '요청 처리에 실패했습니다.');
      }
      setRefetchTrigger(n => n + 1);
      notify('삭제되었습니다', { type: 'success' });
    } catch (err) {
      notify('삭제에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [notify, confirmDialog]);

  const columns = useMemo<ColDef<Company>[]>(() => [
    { field: 'companyCode', headerName: '회사코드', width: 120 },
    { field: 'companyName', headerName: '회사명', width: 180 },
    {
      field: 'companyType', headerName: '회사유형', width: 100,
      valueFormatter: (params) => getTypeLabel(params.value),
    },
    { field: 'country', headerName: '국가', width: 100 },
    { field: 'ceoName', headerName: '대표자', width: 100 },
    { field: 'businessNumber', headerName: '사업자번호', width: 130 },
    {
      field: 'isActive', headerName: '활성', width: 70,
      valueFormatter: (params) => params.value ? '활성' : '비활성',
    },
    {
      headerName: '관리', width: 120, sortable: false,
      cellRenderer: (params: { data: Company }) => {
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
  ], [perm.canUpdate, perm.canDelete, getTypeLabel, handleEdit, handleDelete]);

  const f = (field: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const selectStyle: React.CSSProperties = { width: '100%' };
  const parentOptions = allCompanies.filter(c => !selected || c.id !== selected.id);

  return (
    <div>
      <PeakDataGrid<Company>
        gridId="companies"
        toolbarLeft={
          <>
            <PageTitle />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" onClick={handleNew}>신규 등록</button>
            )}
          </>
        }
        columns={columns}
        queryKey={['companies']}
        queryUrl="/organization/companies"
        enableSearch
        refetchTrigger={refetchTrigger}
      />

      <Modal open={modalOpen} onClose={handleClose} title={selected ? '회사 수정' : '회사 등록'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <FormField label="회사코드" required value={form.companyCode} onChange={f('companyCode')} error={errors.companyCode} />
          <FormField label="회사명" required value={form.companyName} onChange={f('companyName')} error={errors.companyName} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              회사유형<span style={{ color: '#3b82f6', marginLeft: 2 }}>*</span>
            </label>
            <select value={form.companyType} onChange={f('companyType')} style={selectStyle}>
              {typeCodes.map(o => <option key={o.code} value={o.code}>{o.codeName}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              상위회사
            </label>
            <select value={form.parentId} onChange={f('parentId')} style={selectStyle}>
              <option value="">선택하세요</option>
              {parentOptions.map(c => (
                <option key={c.id} value={c.id}>{c.companyName} ({c.companyCode})</option>
              ))}
            </select>
          </div>
          <FormField label="국가" value={form.country} onChange={f('country')} />
          <FormField label="대표자" value={form.ceoName} onChange={f('ceoName')} />
          <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
            <FormField label="주소" value={form.address} onChange={f('address')} />
          </div>
          <FormField label="전화" value={form.phone} onChange={f('phone')} />
          <FormField label="팩스" value={form.fax} onChange={f('fax')} />
          <FormField label="사업자번호" required value={form.businessNumber} onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 10);
            setForm(p => ({ ...p, businessNumber: v }));
          }} error={errors.businessNumber} placeholder="'-'없이 숫자만 입력하세요." />
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
