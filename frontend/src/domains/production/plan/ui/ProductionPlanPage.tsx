import { useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakDataGrid } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';

/* ── Types ── */

interface PlanRow {
  id: number;
  lineNo: string;
  productName: string;
  spec: string;
  material: string;
  category: string;
  prevStock: number;
  [key: string]: unknown;
}

/* ── Helpers ── */

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

/* ── Component ── */

export default function ProductionPlanPage() {
  const perm = usePermission('PM0010');
  const year = 2026;
  const month = 3;
  const daysInMonth = new Date(year, month, 0).getDate(); // 31

  const columns = useMemo<ColDef<PlanRow>[]>(() => {
    const fixed: ColDef<PlanRow>[] = [
      { field: 'lineNo', headerName: 'Line No.', width: 90 },
      { field: 'productName', headerName: '제품명', width: 140 },
      { field: 'spec', headerName: '규격', width: 110 },
      { field: 'material', headerName: '재질', width: 80 },
      { field: 'category', headerName: '구분', width: 80 },
      {
        field: 'prevStock', headerName: '전월재고', width: 90, cellDataType: 'number',
        valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '',
      },
    ];

    const dayCols: ColDef<PlanRow>[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = getDayOfWeek(year, month, d);
      const dayLabel = DAY_NAMES[dow];
      const isWeekend = dow === 0 || dow === 6;
      dayCols.push({
        field: `day${d}`,
        headerName: `${d}(${dayLabel})`,
        width: 65,
        cellDataType: 'number',
        valueFormatter: (p) => p.value != null && p.value !== 0 ? Number(p.value).toLocaleString() : '',
        cellStyle: isWeekend
          ? { backgroundColor: '#fff1f2', color: '#e11d48' }
          : undefined,
        headerClass: isWeekend ? 'ag-header-weekend' : undefined,
      });
    }

    const totalCol: ColDef<PlanRow> = {
      field: 'total',
      headerName: '합계',
      width: 90,
      // pinned: 'right', // 틀 고정 기능으로 테스트
      cellDataType: 'number',
      valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '',
      cellStyle: { fontWeight: 600, backgroundColor: '#f0fdf4' },
    };

    return [...fixed, ...dayCols, totalCol];
  }, [daysInMonth]);

  return (
    <div>
      <PeakDataGrid<PlanRow>
        gridId="production-plan"
        toolbarLeft={<PageTitle />}
        columns={columns}
        queryKey={['production-plan']}
        queryUrl="/production/plans"
        enableSearch={false}
        pageSize={20}
        hideRowNumber
        permission={{ canExport: perm.canExport }}
      />

      <style>{`
        .ag-header-weekend .ag-header-cell-label {
          color: #e11d48 !important;
        }
      `}</style>
    </div>
  );
}
