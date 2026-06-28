/**
 * [TS0030] L1-B 팝업 편집 데모
 * 사용 컴포넌트: MonthlySearchBar, DropdownFilter×2, keyword+조회,
 *              PeakEditGrid(목록) + Modal + FormField
 *
 * 버튼 배치:
 *   1행(조회조건): MonthlySearchBar (기간 버튼 클릭 = 즉시 조회), 업종/지역 드롭다운, 검색어+조회
 *   2행(그리드 툴바): [페이지크기] [신규등록] [편집] ... [엑셀]
 *
 * NOTE: PeakEditGrid에 onRowClick prop이 없으므로 customerCode cellRenderer에서
 *       클릭 이벤트를 처리하여 selectedCustomer 상태를 갱신한다.
 */
import { useState, useMemo, useCallback } from 'react';
import type { ColDef, CellStyle } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/useToast';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakEditGrid } from '@/components/grid';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { MonthlySearchBar } from '@/components/ui/MonthlySearchBar';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { RefreshButton } from '@/components/ui/RefreshButton';

const MENU_CODE = 'TS0030';

const PERIOD_OPTIONS = ['1개월', '3개월', '6개월'] as const;
type Period = typeof PERIOD_OPTIONS[number];

const BIZ_TYPE_OPTIONS = [
  { value: 'MFGR', label: '제조사' },
  { value: 'DIST', label: '유통사' },
  { value: 'SVC',  label: '서비스' },
];
const REGION_OPTIONS = [
  { value: 'SEOUL', label: '서울' },
  { value: 'BUSAN', label: '부산' },
  { value: 'DAEGU', label: '대구' },
];

interface CustomerRow {
  id: number;
  customerCode: string;
  customerName: string;
  bizType: string;
  region: string;
  contact: string;
  isActive: string;
}

const MOCK_DATA: CustomerRow[] = [
  { id: 1, customerCode: 'C001', customerName: 'SK온 주식회사',   bizType: 'MFGR', region: 'SEOUL', contact: '02-1234-0001', isActive: 'Y' },
  { id: 2, customerCode: 'C002', customerName: 'LG에너지솔루션',  bizType: 'MFGR', region: 'SEOUL', contact: '02-2345-0002', isActive: 'Y' },
  { id: 3, customerCode: 'C003', customerName: '삼성SDI',          bizType: 'MFGR', region: 'DAEGU', contact: '053-3456-0003', isActive: 'Y' },
  { id: 4, customerCode: 'C004', customerName: '포스코케미칼',     bizType: 'MFGR', region: 'BUSAN', contact: '051-4567-0004', isActive: 'Y' },
  { id: 5, customerCode: 'C005', customerName: '동진세미켐',       bizType: 'DIST', region: 'SEOUL', contact: '02-5678-0005', isActive: 'Y' },
  { id: 6, customerCode: 'C006', customerName: '엘앤에프',         bizType: 'MFGR', region: 'DAEGU', contact: '053-6789-0006', isActive: 'N' },
];

const emptyForm = { customerCode: '', customerName: '', bizType: '', region: '', contact: '' };
type FormData = typeof emptyForm;

export default function TemplateL1BDemoPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  // 조회 조건
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [period, setPeriod] = useState<Period>('1개월');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [bizType, setBizType] = useState('');
  const [region, setRegion] = useState('');

  // 데이터
  const [allData, setAllData] = useState<CustomerRow[]>(MOCK_DATA);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const displayData = useMemo(() => {
    return allData.filter((r) => {
      if (bizType && r.bizType !== bizType) return false;
      if (region && r.region !== region) return false;
      if (appliedKeyword && !r.customerName.includes(appliedKeyword) && !r.customerCode.includes(appliedKeyword)) return false;
      return true;
    });
  }, [allData, bizType, region, appliedKeyword]);

  const handleSearch = useCallback(() => {
    setAppliedKeyword(keyword);
    notify('(데모) 조회', { type: 'success' });
  }, [keyword, notify]);

  const handleReset = useCallback(() => {
    setKeyword('');
    setAppliedKeyword('');
    setBizType('');
    setRegion('');
    setPeriod('1개월');
    setSelectedCustomer(null);
  }, []);

  // 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);
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

  const handleEdit = useCallback((row: CustomerRow) => {
    setSelected(row);
    setForm({ customerCode: row.customerCode, customerName: row.customerName, bizType: row.bizType, region: row.region, contact: row.contact });
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
    const next: Record<string, string> = {};
    if (!form.customerCode.trim()) next.customerCode = '코드는 필수입니다.';
    if (!form.customerName.trim()) next.customerName = '고객명은 필수입니다.';
    if (Object.keys(next).length) { setErrors(next); return; }

    setSaving(true);
    try {
      if (selected) {
        setAllData((prev) => prev.map((r) => r.id === selected.id ? { ...r, ...form } : r));
      } else {
        const newRow: CustomerRow = { id: Date.now(), ...form, isActive: 'Y' };
        setAllData((prev) => [...prev, newRow]);
      }
      notify(selected ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [form, selected, handleClose, notify]);

  const handleDelete = useCallback(async (row: CustomerRow) => {
    if (!await confirmDialog(`[${row.customerName}]을(를) 삭제하시겠습니까?`)) return;
    setAllData((prev) => prev.filter((r) => r.id !== row.id));
    setSelectedCustomer((prev) => prev?.id === row.id ? null : prev);
    notify('삭제되었습니다', { type: 'success' });
  }, [confirmDialog, notify]);

  const columns = useMemo<ColDef<CustomerRow>[]>(() => [
    { field: 'customerCode', headerName: '고객코드', width: 110, editable: false },
    { field: 'customerName', headerName: '고객명',   flex: 1,   editable: false },
    { field: 'bizType', headerName: '업종', width: 90, editable: false,
      valueFormatter: (p) => BIZ_TYPE_OPTIONS.find((o) => o.value === p.value)?.label ?? String(p.value ?? ''),
    },
    { field: 'region', headerName: '지역', width: 80, editable: false,
      valueFormatter: (p) => REGION_OPTIONS.find((o) => o.value === p.value)?.label ?? String(p.value ?? ''),
    },
    { field: 'contact',  headerName: '연락처',  width: 140, editable: false },
    { field: 'isActive', headerName: '상태', width: 70, editable: false,
      valueFormatter: (p) => p.value === 'Y' ? '활성' : '비활성',
      cellStyle: (p): CellStyle | null => p.value === 'N' ? { color: '#94a3b8' } : null,
    },
    {
      colId: 'actions', headerName: '관리', width: 110, sortable: false,
      cellRenderer: (p: { data: CustomerRow }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {perm.canDelete && (
            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(p.data); }}>삭제</button>
          )}
        </div>
      ),
    },
  ], [perm.canDelete, handleDelete]);

  return (
    <>
      <PageFilterShell
        title={t(`menu.${MENU_CODE}`, { defaultValue: 'L1-B 팝업 편집 데모' })}
        toolbar={
          <MonthlySearchBar
            year={year} month={month}
            onYearMonthChange={(y, m) => { setYear(y); setMonth(m); }}
            period={period} periodOptions={PERIOD_OPTIONS}
            onPeriodChange={(p) => {
              setPeriod(p);
              notify(`(데모) ${p} 조회`, { type: 'success' });
            }}
            onSearch={handleSearch}
            onReset={handleReset}
            hideSearch
          >
            <FilterField label="필터링:">
              <div style={{ display: 'flex', gap: 2 }}>
                <DropdownFilter options={BIZ_TYPE_OPTIONS} value={bizType} onChange={setBizType} allLabel="업종 전체" width={100} />
                <DropdownFilter options={REGION_OPTIONS}   value={region}  onChange={setRegion}  allLabel="지역 전체" width={90} />
              </div>
            </FilterField>
            <FilterField label="검색어:">
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="코드 또는 고객명"
                  style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: 160 }}
                />
                <button className="mes-btn" onClick={handleSearch}>조회</button>
              </div>
            </FilterField>
          </MonthlySearchBar>
        }
        toolbarRight={
          <RefreshButton onRefresh={async () => { notify('(데모) 새로고침', { type: 'success' }); }} />
        }
      >
        <PeakEditGrid
          gridId={`${MENU_CODE}-grid`}
          columns={columns}
          data={displayData as unknown as Record<string, unknown>[]}
          onBatchSave={async () => {}}
          permission={{ canCreate: false, canUpdate: false, canDelete: false, canExport: perm.canExport }}
          onRowClick={(row) => setSelectedCustomer(row as unknown as CustomerRow)}
          extraToolbarButtons={
            <>
              {perm.canCreate && (
                <button className="mes-btn mes-btn-new" onClick={handleCreate}>신규 등록</button>
              )}
              {perm.canUpdate && (
                <button
                  className="mes-btn"
                  onClick={() => selectedCustomer && handleEdit(selectedCustomer)}
                  disabled={!selectedCustomer}
                  style={{ opacity: selectedCustomer ? 1 : 0.4 }}
                >
                  편집
                </button>
              )}
            </>
          }
        />
      </PageFilterShell>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={selected ? '고객사 수정' : '고객사 등록'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField label="고객코드" required value={form.customerCode}
            onChange={(e) => handleChange('customerCode', e.target.value)}
            disabled={selected !== null} placeholder="예: C007" error={errors.customerCode}
          />
          <FormField label="고객명" required value={form.customerName}
            onChange={(e) => handleChange('customerName', e.target.value)}
            placeholder="고객사명 입력" error={errors.customerName}
          />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>업종</label>
            <select value={form.bizType} onChange={(e) => handleChange('bizType', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
              <option value="">선택 안함</option>
              {BIZ_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>지역</label>
            <select value={form.region} onChange={(e) => handleChange('region', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
              <option value="">선택 안함</option>
              {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <FormField label="연락처" value={form.contact}
            onChange={(e) => handleChange('contact', e.target.value)} placeholder="02-0000-0000"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="mes-btn" onClick={handleClose}>취소</button>
          {(selected ? perm.canUpdate : perm.canCreate) && (
            <button className="mes-btn mes-btn-save" onClick={handleSave} disabled={saving}
              style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
