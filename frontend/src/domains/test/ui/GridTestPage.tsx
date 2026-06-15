import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';

/** 100건 더미 데이터 생성 */
function generateTestData(): Record<string, unknown>[] {
  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    itemCode: `ITEM-${String(i + 1).padStart(3, '0')}`,
    itemName: `테스트 품목 ${i + 1}`,
    category: ['원자재', '부자재', '완제품'][i % 3],
    quantity: Math.floor(Math.random() * 1000) + 1,
    unitPrice: Math.floor(Math.random() * 50000) + 1000,
    isActive: i % 10 === 0 ? 'N' : 'Y',
    remark: i % 5 === 0 ? `비고 ${i + 1}` : '',
  }));
}

export default function GridTestPage() {
  const testData = useMemo(() => generateTestData(), []);

  const columns = useMemo<ColDef[]>(() => [
    { field: 'itemCode', headerName: '품목코드', width: 130 },
    { field: 'itemName', headerName: '품목명', width: 180 },
    { field: 'category', headerName: '구분', width: 100 },
    { field: 'quantity', headerName: '수량', width: 100, type: 'numericColumn' },
    { field: 'unitPrice', headerName: '단가', width: 120, type: 'numericColumn' },
    { field: 'isActive', headerName: '사용여부', width: 90 },
    { field: 'remark', headerName: '비고', width: 200 },
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <PageTitle label="그리드 테스트 (100건)" />
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
        PeakEditGrid 순번 누적 테스트 — 페이지 전환 시 No. 컬럼이 누적되는지 확인
      </p>
      <div style={{ flex: 1 }}>
        <PeakEditGrid
          data={testData}
          columns={columns}
        />
      </div>
    </div>
  );
}
