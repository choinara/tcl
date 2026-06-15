/**
 * [TS0020] L1-A 인라인 편집 데모
 * 사용 컴포넌트: MonthRangeFilter, TabFilter, DropdownFilter×2,
 *              ExcelUploadButton, TemplateDownloadButton, PeakEditGrid
 */
import { useState, useMemo, useCallback } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakEditGrid } from '@/components/grid';
import { MonthRangeFilter } from '@/components/ui/MonthRangeFilter';
import { TabFilter } from '@/components/ui/TabFilter';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { ExcelUploadButton } from '@/components/ui/ExcelUploadButton';
import { TemplateDownloadButton } from '@/components/ui/TemplateDownloadButton';

const MENU_CODE = 'TS0020';

const PROCESS_OPTIONS = [
  { value: 'CU', label: '동도금' },
  { value: 'SN', label: '주석도금' },
  { value: 'AU', label: '금도금' },
];

const TYPE_OPTIONS = [
  { value: 'RAW', label: '원자재' },
  { value: 'SEMI', label: '반제품' },
  { value: 'FIN', label: '완제품' },
];

const TABS = [
  { value: '', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

const MOCK_DATA: Record<string, unknown>[] = [
  { id: 1, materialCode: 'M001', materialName: '동판 0.1T', process: 'CU', type: 'RAW', spec: '0.1×250mm', stock: 500, isActive: 'Y' },
  { id: 2, materialCode: 'M002', materialName: '동판 0.2T', process: 'CU', type: 'RAW', spec: '0.2×250mm', stock: 300, isActive: 'Y' },
  { id: 3, materialCode: 'M003', materialName: '주석합금 A', process: 'SN', type: 'RAW', spec: 'Sn96.5/Ag3.5', stock: 120, isActive: 'Y' },
  { id: 4, materialCode: 'P001', materialName: '전처리 반제품', process: 'CU', type: 'SEMI', spec: '—', stock: 80, isActive: 'Y' },
  { id: 5, materialCode: 'F001', materialName: '도금 완제품 A', process: 'AU', type: 'FIN', spec: 'Au 0.1μm', stock: 200, isActive: 'Y' },
  { id: 6, materialCode: 'F002', materialName: '도금 완제품 B', process: 'SN', type: 'FIN', spec: 'Sn 5μm', stock: 0, isActive: 'N' },
];

export default function TemplateL1ADemoPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);

  const [fromYear, setFromYear] = useState(2026);
  const [fromMonth, setFromMonth] = useState(1);
  const [toYear, setToYear] = useState(2026);
  const [toMonth, setToMonth] = useState(12);
  const [activeTab, setActiveTab] = useState('');
  const [process, setProcess] = useState('');
  const [type, setType] = useState('');

  const [data, setData] = useState<Record<string, unknown>[]>(MOCK_DATA);

  const displayData = useMemo(
    () => data.filter((r) => {
      if (activeTab && r.isActive !== activeTab) return false;
      if (process && r.process !== process) return false;
      if (type && r.type !== type) return false;
      return true;
    }),
    [data, activeTab, process, type],
  );

  const columns = useMemo<ColDef[]>(() => [
    { field: 'materialCode', headerName: '자재코드', width: 120, editable: (p) => !p.data?.id },
    { field: 'materialName', headerName: '자재명',   width: 200, editable: true },
    { field: 'process',      headerName: '공정',     width: 100, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: PROCESS_OPTIONS.map((o) => o.value) },
      valueFormatter: (p) => PROCESS_OPTIONS.find((o) => o.value === p.value)?.label ?? p.value ?? '',
    },
    { field: 'type',    headerName: '유형',  width: 90, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: TYPE_OPTIONS.map((o) => o.value) },
      valueFormatter: (p) => TYPE_OPTIONS.find((o) => o.value === p.value)?.label ?? p.value ?? '',
    },
    { field: 'spec',  headerName: 'Spec',  width: 140, editable: true },
    { field: 'stock', headerName: '재고', width: 80, editable: true, type: 'numericColumn' },
    { field: 'isActive', headerName: '사용', width: 80, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Y', 'N'] },
      valueFormatter: (p) => p.value === 'Y' ? '사용' : '미사용',
      cellStyle: (p) => p.value === 'N' ? { color: '#94a3b8' } : {},
    },
  ], []);

  const handleBatchSave = useCallback(async () => {
    notify('(데모) 저장 완료', { type: 'success' });
  }, [notify]);

  return (
    <PageFilterShell
      title={t(`menu.${MENU_CODE}`, { defaultValue: 'L1-A 인라인 편집 데모' })}
      toolbar={
        <>
          <TabFilter tabs={TABS} value={activeTab} onChange={setActiveTab} />
          <MonthRangeFilter
            fromYear={fromYear} fromMonth={fromMonth}
            toYear={toYear} toMonth={toMonth}
            onFromChange={(y, m) => { setFromYear(y); setFromMonth(m); }}
            onToChange={(y, m) => { setToYear(y); setToMonth(m); }}
          />
          <FilterField label="필터링:">
            <div style={{ display: 'flex', gap: 2 }}>
              <DropdownFilter options={PROCESS_OPTIONS} value={process} onChange={setProcess} allLabel="공정 전체" width={100} />
              <DropdownFilter options={TYPE_OPTIONS}    value={type}    onChange={setType}    allLabel="유형 전체" width={100} />
            </div>
          </FilterField>
        </>
      }
      toolbarRight={
        <>
          <TemplateDownloadButton templateUrl="/api/test/template" fileName="자재_템플릿.xlsx" />
          <ExcelUploadButton uploadUrl="/api/test/upload" onSuccess={() => notify('(데모) 업로드 완료', { type: 'success' })} />
        </>
      }
    >
      <PeakEditGrid
        gridId={`${MENU_CODE}-grid`}
        columns={columns}
        data={displayData}
        onBatchSave={handleBatchSave}
        permission={perm}
        saveButtonLabel="저장"
      />
    </PageFilterShell>
  );
}
