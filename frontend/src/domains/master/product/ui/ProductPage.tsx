import { useState, useRef, useMemo, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';

/* ---- 목업 데이터 (설계 검토용 — DB 구현 전 하드코딩) ---- */
const MOCK_DATA: Record<string, unknown>[] = [
  {
    id: 1, materialType: 'CU', materialModel: 'CQ8', partnerName: '일신금속',
    rawMaterial: '0245 일반동', materialStatus: '일반', customerName: 'CHS Global',
    productModel: 'HO SK', platingThickness: '0.3μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'N',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.10', width: '30.0', unitConversion: 12.93, isActive: 'Y',
  },
  {
    id: 2, materialType: 'CU', materialModel: '4C4_S', partnerName: '일신금속',
    rawMaterial: '0445 HO SK', materialStatus: '반경', customerName: 'CHS Global',
    productModel: 'HO SK', platingThickness: '0.5μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'Y',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.15', width: '25.0', unitConversion: 24.51, isActive: 'Y',
  },
  {
    id: 3, materialType: 'CU', materialModel: 'CL6', partnerName: '일신금속',
    rawMaterial: '0345 일반동', materialStatus: '일반', customerName: 'CHS Global',
    productModel: '일반동', platingThickness: '0.3μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'N',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.10', width: '30.0', unitConversion: 12.93, isActive: 'Y',
  },
  {
    id: 4, materialType: 'CU', materialModel: 'AB6', partnerName: '일신금속',
    rawMaterial: '0360 일반동', materialStatus: '일반', customerName: 'CHS Global',
    productModel: '일반동', platingThickness: '0.3μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'N',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.10', width: '30.0', unitConversion: 12.93, isActive: 'Y',
  },
  {
    id: 5, materialType: 'CU', materialModel: 'PD6', partnerName: '일신금속',
    rawMaterial: '0245 양인_AESC', materialStatus: '일반', customerName: 'AESC',
    productModel: '양인_AESC', platingThickness: '0.3μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'N',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.10', width: '25.0', unitConversion: 12.93, isActive: 'Y',
  },
  {
    id: 6, materialType: 'CU', materialModel: 'CQ6', partnerName: '일신금속',
    rawMaterial: '0245 일반동', materialStatus: '일반', customerName: 'CHS Global',
    productModel: '일반동', platingThickness: '0.3μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'N',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.10', width: '30.0', unitConversion: 12.93, isActive: 'Y',
  },
  {
    id: 7, materialType: 'CU', materialModel: '4C4_L', partnerName: '일신금속',
    rawMaterial: '0445 HO LG', materialStatus: '반경', customerName: 'LG전자',
    productModel: 'HO LG', platingThickness: '0.5μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'Y',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.15', width: '25.0', unitConversion: 24.51, isActive: 'Y',
  },
  {
    id: 8, materialType: 'CU', materialModel: '4C4_A', partnerName: '일신금속',
    rawMaterial: '0445 HO AESC', materialStatus: '반경', customerName: 'AESC',
    productModel: 'HO AESC', platingThickness: '0.5μm',
    processRolling: 'Y', processPlating: 'Y', processHeatTreatment: 'Y',
    processSurfaceTreatment: 'N', processPackaging: 'N',
    thickness: '0.15', width: '25.0', unitConversion: 24.51, isActive: 'N',
  },
];

const PROCESS_VALUES = ['Y', 'N'];
const MATERIAL_TYPE_VALUES = ['CU', 'AL', 'SUS'];
const MATERIAL_STATUS_VALUES = ['일반', '반경', '경질', '연질'];

export default function ProductPage() {
  const perm = usePermission('MM0070');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const [data, setData] = useState<Record<string, unknown>[]>(MOCK_DATA);
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(
    () => showAll ? data : data.filter(r => r.isActive === 'Y'),
    [data, showAll],
  );

  const handleAddRow = useCallback(() => {
    editGridRef.current?.appendRow({
      materialType: 'CU', materialModel: '', partnerName: '',
      rawMaterial: '', materialStatus: '일반', customerName: '',
      productModel: '', platingThickness: '', processRolling: 'Y',
      processPlating: 'Y', processHeatTreatment: 'N',
      processSurfaceTreatment: 'N', processPackaging: 'N',
      thickness: '', width: '', unitConversion: null, isActive: 'Y',
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
        headerName: '원자재',
        headerClass: 'mp-header-rm',
        children: [
          {
            field: 'materialType', headerName: '재질', width: 80,
            headerClass: 'mp-header-rm',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: MATERIAL_TYPE_VALUES },
          } as ColDef,
          {
            field: 'materialModel', headerName: '모델', width: 80,
            headerClass: 'mp-header-rm',
            editable: (p) => !p.data?.id,
          } as ColDef,
          {
            field: 'partnerName', headerName: '입고처', width: 110,
            headerClass: 'mp-header-rm',
          } as ColDef,
          {
            field: 'rawMaterial', headerName: '원재료', width: 150,
            headerClass: 'mp-header-rm',
          } as ColDef,
          {
            field: 'materialStatus', headerName: '재질상태', width: 80,
            headerClass: 'mp-header-rm',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: MATERIAL_STATUS_VALUES },
          } as ColDef,
        ],
      } as ColGroupDef,

      {
        headerName: '제품',
        headerClass: 'mp-header-pd',
        children: [
          {
            headerName: '제품규격', width: 200, editable: false,
            headerClass: 'mp-header-pd',
            valueGetter: p => {
              const d = p.data as Record<string, unknown> | undefined;
              if (!d) return '';
              return [d.materialType, d.rawMaterial, d.materialStatus]
                .filter(Boolean).join(' ');
            },
            cellStyle: { backgroundColor: '#F9FAFB', color: '#374151' },
          } as ColDef,
          {
            field: 'customerName', headerName: '고객사(End User)', width: 130,
            headerClass: 'mp-header-pd',
          } as ColDef,
          {
            field: 'productModel', headerName: '제품모델', width: 90,
            headerClass: 'mp-header-pd',
          } as ColDef,
          {
            field: 'platingThickness', headerName: '도금두께', width: 90,
            headerClass: 'mp-header-pd',
          } as ColDef,
          {
            field: 'processRolling', headerName: '압연', width: 60,
            headerClass: 'mp-header-pd',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: PROCESS_VALUES },
          } as ColDef,
          {
            field: 'processPlating', headerName: '도금', width: 60,
            headerClass: 'mp-header-pd',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: PROCESS_VALUES },
          } as ColDef,
          {
            field: 'processHeatTreatment', headerName: '열처리', width: 70,
            headerClass: 'mp-header-pd',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: PROCESS_VALUES },
          } as ColDef,
          {
            field: 'processSurfaceTreatment', headerName: '표면처리', width: 80,
            headerClass: 'mp-header-pd',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: PROCESS_VALUES },
          } as ColDef,
          {
            field: 'processPackaging', headerName: '포장', width: 60,
            headerClass: 'mp-header-pd',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: PROCESS_VALUES },
          } as ColDef,
          {
            field: 'thickness', headerName: '두께', width: 70,
            headerClass: 'mp-header-pd',
          } as ColDef,
          {
            field: 'width', headerName: '폭', width: 70,
            headerClass: 'mp-header-pd',
          } as ColDef,
          {
            field: 'unitConversion', headerName: '단위환산(m/Kg)', width: 130,
            headerClass: 'mp-header-pd',
            cellDataType: 'number' as const,
          } as ColDef,
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
        .mp-header-rm,
        .mp-header-rm .ag-header-group-cell-label { background-color: #F4B084 !important; color: #7c2d12 !important; font-weight: 600; }
        .mp-header-pd,
        .mp-header-pd .ag-header-group-cell-label { background-color: #A9D08E !important; color: #14532d !important; font-weight: 600; }
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
        gridId="master-material-product"
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
