/**
 * [L1-B] 단일 그리드 + 팝업 편집 템플릿
 *
 * 사용 상황: 목록 조회 + 행 클릭 시 모달에서 생성/수정
 * 대표 메뉴: 사용자관리(UM0010), 역할관리(SM0030)
 *
 * 복사 후 처리:
 *   1. MENU_CODE, API_BASE 교체
 *   2. Entity, FormData 타입 정의
 *   3. columns 정의 작성
 *   4. 모달 폼 필드 작성 (FormField 컴포넌트 활용)
 *   5. validate() 로직 작성
 *   6. 필요 없는 필터 제거 / 필터 추가
 */

import { useState, useCallback, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useDateRange } from '@/hooks/useDateRange';
import { useCommonCodes } from '@/hooks/useCommonCodes';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { RefreshButton } from '@/components/ui/RefreshButton';

// TODO: 메뉴코드 + API 경로 교체
const MENU_CODE = 'XX0000';
const API_BASE = '/api/xxx/yyy';

// TODO: 엔티티 타입 정의
interface Entity {
  id: number;
  code: string;
  name: string;
  description?: string;
}

// TODO: 모달 폼 타입 정의
interface FormData {
  code: string;
  name: string;
  description: string;
}

const emptyForm: FormData = {
  code: '',
  name: '',
  description: '',
};

export default function TemplateL1BPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  // 필터 상태
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const [typeFilter, setTypeFilter] = useState('');
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // TODO: 필요한 공통코드 그룹 추가
  const allCodes = useCommonCodes('TYPE_CODE');
  const typeOptions = allCodes['TYPE_CODE'] ?? [];

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const handleCreate = useCallback(() => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((row: Entity) => {
    setSelected(row);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description ?? '',
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

  // TODO: 유효성 검증 로직 작성
  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!form.code.trim()) next.code = '코드는 필수입니다.';
    if (!form.name.trim()) next.name = '명칭은 필수입니다.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isEdit = selected !== null;
      const url = isEdit ? `${API_BASE}/${selected.id}` : API_BASE;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message ?? '저장에 실패했습니다.');
      }
      setRefetchTrigger((v) => v + 1);
      notify(isEdit ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      handleClose();
    } catch (e) {
      notify('저장 실패: ' + (e instanceof Error ? e.message : String(e)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, selected, validate, handleClose, notify]);

  const handleDelete = useCallback(async (row: Entity) => {
    if (!await confirmDialog(`[${row.name}]을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`${API_BASE}/${row.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message ?? '삭제에 실패했습니다.');
      }
      setRefetchTrigger((v) => v + 1);
      notify('삭제되었습니다', { type: 'success' });
    } catch (e) {
      notify('삭제 실패: ' + (e instanceof Error ? e.message : String(e)), { type: 'error' });
    }
  }, [confirmDialog, notify]);

  // TODO: 컬럼 정의 작성
  const columns = useMemo<ColDef<Entity>[]>(() => [
    { field: 'code',        headerName: '코드', width: 130 },
    { field: 'name',        headerName: '명칭', width: 200 },
    { field: 'description', headerName: '설명', flex: 1 },
    {
      colId: 'actions', headerName: '관리', width: 140, sortable: false,
      cellRenderer: (p: { data: Entity }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {perm.canUpdate && (
            <button className="btn-edit" onClick={(e) => { e.stopPropagation(); handleEdit(p.data); }}>
              수정
            </button>
          )}
          {perm.canDelete && (
            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(p.data); }}>
              삭제
            </button>
          )}
        </div>
      ),
    },
  ], [perm.canUpdate, perm.canDelete, handleEdit, handleDelete]);

  const extraParams = useMemo<Record<string, string | undefined>>(() => ({
    ...(dateFrom && { startDate: dateFrom }),
    ...(dateTo && { endDate: dateTo }),
    ...(typeFilter && { type: typeFilter }),
  }), [dateFrom, dateTo, typeFilter]);

  return (
    <>
      <PageFilterShell
        title={t(`menu.${MENU_CODE}`)}
        toolbar={
          <>
            <DateRangeFilter
              label="기간"
              dateFrom={dateFrom} dateTo={dateTo}
              onChangeDateFrom={setDateFrom} onChangeDateTo={setDateTo}
            />
            <FilterField label="필터링:">
              <div style={{ display: 'flex', gap: 2 }}>
                <DropdownFilter
                  options={typeOptions} value={typeFilter} onChange={setTypeFilter}
                  allLabel="유형 전체" width={110}
                />
                {/* TODO: 드롭다운 추가 시 여기에 DropdownFilter 추가 */}
              </div>
            </FilterField>
          </>
        }
        toolbarRight={
          <>
            <RefreshButton onRefresh={() => setRefetchTrigger((v) => v + 1)} />
            {perm.canCreate && (
              <button className="mes-btn mes-btn-new" onClick={handleCreate}>
                신규 등록
              </button>
            )}
          </>
        }
      >
        <PeakDataGrid<Entity>
          queryKey={[MENU_CODE, dateFrom ?? '', dateTo ?? '', typeFilter]}
          queryUrl={API_BASE.replace('/api', '')}
          columns={columns}
          extraParams={extraParams}
          onRowClick={handleEdit}
          refetchTrigger={refetchTrigger}
          permission={{ canExport: perm.canExport }}
        />
      </PageFilterShell>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={selected ? `${t(`menu.${MENU_CODE}`)} 수정` : `${t(`menu.${MENU_CODE}`)} 등록`}
      >
        {/* TODO: 모달 폼 필드 작성 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField
            label="코드" required
            value={form.code}
            onChange={(e) => handleChange('code', e.target.value)}
            disabled={selected !== null}
            placeholder="코드를 입력하세요"
            error={errors.code}
          />
          <FormField
            label="명칭" required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="명칭을 입력하세요"
            error={errors.name}
          />
          <FormField
            label="설명"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="설명을 입력하세요"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="mes-btn" onClick={handleClose}>취소</button>
          {(selected ? perm.canUpdate : perm.canCreate) && (
            <button
              className="mes-btn mes-btn-save"
              onClick={handleSave}
              disabled={saving}
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
