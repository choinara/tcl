import { useState, useRef, useMemo, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

/* ---- 원자재제품 목업 (MM0070 데이터와 동기화) ---- */
interface MaterialProductMock {
  id: number;
  label: string;
  materialType: string;
  materialModel: string;
  rawMaterial: string;
  materialStatus: string;
  productModel: string;
  customerName: string;
  unitConversion: number;
}

const MOCK_MATERIAL_PRODUCTS: MaterialProductMock[] = [
  { id: 1, label: 'CU | CQ8 | 0245 일반동 | 일반 | CHS Global',
    materialType: 'CU', materialModel: 'CQ8', rawMaterial: '0245 일반동',
    materialStatus: '일반', productModel: 'HO SK', customerName: 'CHS Global', unitConversion: 12.93 },
  { id: 2, label: 'CU | 4C4_S | 0445 HO SK | 반경 | CHS Global',
    materialType: 'CU', materialModel: '4C4_S', rawMaterial: '0445 HO SK',
    materialStatus: '반경', productModel: 'HO SK', customerName: 'CHS Global', unitConversion: 24.51 },
  { id: 3, label: 'CU | CL6 | 0345 일반동 | 일반 | CHS Global',
    materialType: 'CU', materialModel: 'CL6', rawMaterial: '0345 일반동',
    materialStatus: '일반', productModel: '일반동', customerName: 'CHS Global', unitConversion: 12.93 },
  { id: 4, label: 'CU | AB6 | 0360 일반동 | 일반 | CHS Global',
    materialType: 'CU', materialModel: 'AB6', rawMaterial: '0360 일반동',
    materialStatus: '일반', productModel: '일반동', customerName: 'CHS Global', unitConversion: 12.93 },
  { id: 5, label: 'CU | PD6 | 0245 양인_AESC | 일반 | AESC',
    materialType: 'CU', materialModel: 'PD6', rawMaterial: '0245 양인_AESC',
    materialStatus: '일반', productModel: '양인_AESC', customerName: 'AESC', unitConversion: 12.93 },
  { id: 6, label: 'CU | CQ6 | 0245 일반동 | 일반 | CHS Global',
    materialType: 'CU', materialModel: 'CQ6', rawMaterial: '0245 일반동',
    materialStatus: '일반', productModel: '일반동', customerName: 'CHS Global', unitConversion: 12.93 },
  { id: 7, label: 'CU | 4C4_L | 0445 HO LG | 반경 | LG전자',
    materialType: 'CU', materialModel: '4C4_L', rawMaterial: '0445 HO LG',
    materialStatus: '반경', productModel: 'HO LG', customerName: 'LG전자', unitConversion: 24.51 },
];

const MP_MAP: Record<number, MaterialProductMock> = Object.fromEntries(
  MOCK_MATERIAL_PRODUCTS.map(mp => [mp.id, mp]),
);
const MP_LABELS = MOCK_MATERIAL_PRODUCTS.map(mp => mp.label);
const LABEL_TO_ID: Record<string, number> = Object.fromEntries(
  MOCK_MATERIAL_PRODUCTS.map(mp => [mp.label, mp.id]),
);

/* ---- 시간당생산량 목업 데이터 (설계 검토용 — DB 구현 전 하드코딩) ---- */
const MOCK_RATE_DATA: Record<string, unknown>[] = [
  { id: 1, materialProductId: 1, rate4m: null, rate6m: null, rate8m: 77.41, isActive: 'Y' },
  { id: 2, materialProductId: 2, rate4m: null, rate6m: 40.82, rate8m: null, isActive: 'Y' },
  { id: 3, materialProductId: 3, rate4m: null, rate6m: null, rate8m: null, isActive: 'Y' },
  { id: 4, materialProductId: 4, rate4m: null, rate6m: null, rate8m: null, isActive: 'Y' },
  { id: 5, materialProductId: 5, rate4m: null, rate6m: null, rate8m: null, isActive: 'Y' },
  { id: 6, materialProductId: 6, rate4m: null, rate6m: null, rate8m: 77.41, isActive: 'Y' },
  { id: 7, materialProductId: 7, rate4m: null, rate6m: 40.82, rate8m: null, isActive: 'Y' },
];

export default function ProductionRatePage() {
  const perm = usePermission('MM0080');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [data, setData] = useState<Record<string, unknown>[]>(MOCK_RATE_DATA);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(
    () => showAll ? data : data.filter(r => r.isActive === 'Y'),
    [data, showAll],
  );

  const handleAddRow = useCallback(() => {
    editGridRef.current?.appendRow({
      materialProductId: null, rate4m: null, rate6m: null, rate8m: null, isActive: 'Y',
    });
  }, []);

  const handleDeleteRow = useCallback(() => {
    editGridRef.current?.deleteSelectedRows();
  }, []);

  const handleBatchSave = useCallback(
    async (rows: { _rowState: string; [key: string]: unknown }[]) => {
      /* 목업 저장 — DB 구현 후 실제 API 호출로 교체 */
      notify(`목업 데이터입니다 (변경 ${rows.length}건). DB 구현 후 저장 가능합니다.`, { type: 'info' });
      setData(prev => {
        const updated = [...prev];
        rows.forEach(r => {
          const idx = updated.findIndex(d => d.id === r.id);
          if (r._rowState === 'created') updated.push({ ...r, id: Date.now() });
          else if (r._rowState === 'updated' && idx >= 0) updated[idx] = { ...r };
          else if (r._rowState === 'deleted' && idx >= 0) updated.splice(idx, 1);
        });
        return updated;
      });
    },
    [notify],
  );

  const columns = useMemo<(ColDef | ColGroupDef)[]>(
    () => [
      {
        headerName: '원자재 / 제품',
        headerClass: 'pr-header-rm',
        children: [
          {
            field: 'materialProductId',
            headerName: '원자재제품 선택',
            width: 310,
            headerClass: 'pr-header-rm',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: MP_LABELS },
            valueGetter: p => {
              const id = p.data?.materialProductId as number | null | undefined;
              return id ? (MP_MAP[id]?.label ?? '') : '';
            },
            valueSetter: p => {
              const label = p.newValue as string | null;
              if (p.data) {
                (p.data as Record<string, unknown>).materialProductId =
                  label ? (LABEL_TO_ID[label] ?? null) : null;
              }
              return true;
            },
          } as ColDef,
          {
            headerName: '재질', width: 70, editable: false,
            headerClass: 'pr-header-rm',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.materialType ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '모델', width: 80, editable: false,
            headerClass: 'pr-header-rm',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.materialModel ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '원재료', width: 150, editable: false,
            headerClass: 'pr-header-rm',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.rawMaterial ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '재질상태', width: 80, editable: false,
            headerClass: 'pr-header-rm',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.materialStatus ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
        ],
      } as ColGroupDef,

      {
        headerName: '제품 / 생산량',
        headerClass: 'pr-header-pd',
        children: [
          {
            headerName: '제품모델', width: 90, editable: false,
            headerClass: 'pr-header-pd',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.productModel ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '고객사', width: 110, editable: false,
            headerClass: 'pr-header-pd',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.customerName ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '단위환산(m/Kg)', width: 130, editable: false,
            headerClass: 'pr-header-pd',
            valueGetter: p => MP_MAP[p.data?.materialProductId as number]?.unitConversion ?? '',
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            headerName: '생산속도(m/min)별 생산량(kg/Hr)',
            headerClass: 'pr-header-pd',
            children: [
              {
                field: 'rate4m', headerName: '4', width: 90,
                headerClass: 'pr-header-pd',
                cellDataType: 'number' as const,
                valueFormatter: (p: { value: unknown }) =>
                  p.value != null ? String(p.value) : '-',
              } as ColDef,
              {
                field: 'rate6m', headerName: '6', width: 90,
                headerClass: 'pr-header-pd',
                cellDataType: 'number' as const,
                valueFormatter: (p: { value: unknown }) =>
                  p.value != null ? String(p.value) : '-',
              } as ColDef,
              {
                field: 'rate8m', headerName: '8', width: 90,
                headerClass: 'pr-header-pd',
                cellDataType: 'number' as const,
                valueFormatter: (p: { value: unknown }) =>
                  p.value != null ? String(p.value) : '-',
              } as ColDef,
            ],
          } as ColGroupDef,
        ],
      } as ColGroupDef,

      {
        headerName: '',
        suppressSpanHeaderHeight: true,
        children: [
          {
            field: 'isActive', headerName: '사용', width: 70,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Y', 'N'] },
            valueFormatter: (p: { value: unknown }) => p.value === 'Y' ? '사용' : '미사용',
            cellStyle: (p: { value: unknown }) => p.value === 'N' ? { color: '#94a3b8' } : {},
          } as ColDef,
        ],
      } as ColGroupDef,
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .pr-header-rm,
        .pr-header-rm .ag-header-group-cell-label { background-color: #F4B084 !important; color: #7c2d12 !important; font-weight: 600; }
        .pr-header-pd,
        .pr-header-pd .ag-header-group-cell-label { background-color: #A9D08E !important; color: #14532d !important; font-weight: 600; }
      `}</style>

      <div className="grid-toolbar">
        <PageTitle />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => setShowAll(v => !v)} className="mes-btn" style={{ fontSize: 11 }}>
            {showAll ? '미사용 포함' : '미사용 제외'}
          </button>
          <button onClick={handleAddRow} className="mes-btn">행추가</button>
          <button onClick={handleDeleteRow} className="mes-btn mes-btn-delete">행삭제</button>
        </div>
      </div>

      <PeakEditGrid
        ref={editGridRef}
        gridId="master-production-rate"
        columns={columns}
        data={displayData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        saveButtonLabel="저장"
        permission={perm}
      />
    </div>
  );
}
