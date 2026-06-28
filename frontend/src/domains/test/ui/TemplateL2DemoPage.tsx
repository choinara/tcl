/**
 * [TS0040] L2 분할 그리드 데모
 * 사용 컴포넌트: YearMonthRangeSearchBar, DropdownFilter, RefreshButton,
 *              PeakEditGrid(마스터) + PeakEditGrid(디테일) -- 상하 분할
 *
 * NOTE: PeakEditGrid에 onRowClick prop이 없으므로
 *       마스터 그리드 orderNo 컬럼의 cellRenderer에서 클릭 이벤트를 처리한다.
 */
import { useState, useMemo, useCallback } from 'react';
import type { ColDef, CellStyle } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/useToast';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { PeakEditGrid } from '@/components/grid';
import { YearMonthRangeSearchBar } from '@/components/ui/YearMonthRangeSearchBar';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';
import { RefreshButton } from '@/components/ui/RefreshButton';

const MENU_CODE = 'TS0040';

const STATUS_OPTIONS = [
  { value: 'OPEN',     label: '접수' },
  { value: 'PROGRESS', label: '진행' },
  { value: 'DONE',     label: '완료' },
];

interface OrderRow {
  id: number;
  orderNo: string;
  customer: string;
  orderDate: string;
  dueDate: string;
  totalQty: number;
  status: string;
  [key: string]: unknown;
}

interface OrderDetailRow {
  id?: number;
  orderId: number;
  seq: number;
  productCode: string;
  productName: string;
  qty: number;
  unit: string;
  remark?: string;
  [key: string]: unknown;
}

const MOCK_ORDERS: OrderRow[] = [
  { id: 1, orderNo: 'ORD-2026-001', customer: 'SK온',      orderDate: '2026-05-01', dueDate: '2026-05-20', totalQty: 1500, status: 'DONE' },
  { id: 2, orderNo: 'ORD-2026-002', customer: 'LG에너지',  orderDate: '2026-05-03', dueDate: '2026-05-25', totalQty: 2000, status: 'PROGRESS' },
  { id: 3, orderNo: 'ORD-2026-003', customer: '삼성SDI',   orderDate: '2026-05-07', dueDate: '2026-05-28', totalQty: 800,  status: 'PROGRESS' },
  { id: 4, orderNo: 'ORD-2026-004', customer: '포스코케미', orderDate: '2026-05-10', dueDate: '2026-06-05', totalQty: 1200, status: 'OPEN' },
];

const MOCK_DETAILS: Record<number, OrderDetailRow[]> = {
  1: [
    { id: 101, orderId: 1, seq: 1, productCode: 'F001', productName: 'Au 도금 완제품 A', qty: 1000, unit: 'EA' },
    { id: 102, orderId: 1, seq: 2, productCode: 'F002', productName: 'Sn 도금 완제품 B', qty: 500,  unit: 'EA' },
  ],
  2: [
    { id: 201, orderId: 2, seq: 1, productCode: 'F003', productName: 'Cu 도금 완제품 C', qty: 2000, unit: 'EA' },
  ],
  3: [
    { id: 301, orderId: 3, seq: 1, productCode: 'F001', productName: 'Au 도금 완제품 A', qty: 400, unit: 'EA' },
    { id: 302, orderId: 3, seq: 2, productCode: 'F004', productName: 'Ni 도금 완제품 D', qty: 400, unit: 'EA' },
  ],
  4: [],
};

export default function TemplateL2DemoPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);

  const [fromYear, setFromYear] = useState(2026);
  const [fromMonth, setFromMonth] = useState(1);
  const [toYear, setToYear] = useState(2026);
  const [toMonth, setToMonth] = useState(5);
  const [statusFilter, setStatusFilter] = useState('');

  const [orders] = useState<OrderRow[]>(MOCK_ORDERS);
  const [detailMap] = useState<Record<number, OrderDetailRow[]>>(MOCK_DETAILS);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  const displayOrders = useMemo(
    () => orders.filter((o) => !statusFilter || o.status === statusFilter),
    [orders, statusFilter],
  );

  const detailData = useMemo<OrderDetailRow[]>(
    () => (selectedOrder ? (detailMap[selectedOrder.id] ?? []) : []),
    [selectedOrder, detailMap],
  );

  const handleSelectOrder = useCallback((row: OrderRow) => {
    setSelectedOrder(row);
  }, []);

  const masterColumns = useMemo<ColDef[]>(() => [
    { field: 'orderNo',   headerName: '수주번호', width: 150, editable: false,
      cellRenderer: (p: { data: OrderRow; value: string }) => (
        <span
          style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleSelectOrder(p.data)}
        >
          {p.value}
        </span>
      ),
    },
    { field: 'customer',  headerName: '고객사',   width: 130, editable: false },
    { field: 'orderDate', headerName: '수주일',   width: 110, editable: false },
    { field: 'dueDate',   headerName: '납기일',   width: 110, editable: false },
    { field: 'totalQty',  headerName: '수량',     width: 90,  editable: false, type: 'numericColumn' },
    { field: 'status', headerName: '상태', width: 90, editable: false,
      valueFormatter: (p) => STATUS_OPTIONS.find((o) => o.value === p.value)?.label ?? String(p.value ?? ''),
      cellStyle: (p): CellStyle | null => {
        if (p.value === 'DONE') return { color: '#64748b' };
        if (p.value === 'PROGRESS') return { color: '#2563eb', fontWeight: 600 };
        return null;
      },
    },
  ], [handleSelectOrder]);

  const detailColumns = useMemo<ColDef[]>(() => [
    { field: 'seq',         headerName: '순번',   width: 60 },
    { field: 'productCode', headerName: '제품코드', width: 120, editable: (p) => !p.data?.id },
    { field: 'productName', headerName: '제품명',  flex: 1,   editable: true },
    { field: 'qty',         headerName: '수량',   width: 90,  editable: true, type: 'numericColumn' },
    { field: 'unit',        headerName: '단위',   width: 70,  editable: true },
    { field: 'remark',      headerName: '비고',   width: 160, editable: true },
  ], []);

  const handleDetailBatchSave = useCallback(async () => {
    if (!selectedOrder) return;
    notify('(데모) 상세 저장 완료', { type: 'success' });
  }, [selectedOrder, notify]);

  const handleSearch = useCallback(() => {
    notify(`(데모) ${fromYear}-${String(fromMonth).padStart(2,'0')} ~ ${toYear}-${String(toMonth).padStart(2,'0')} 조회`, { type: 'success' });
  }, [fromYear, fromMonth, toYear, toMonth, notify]);

  return (
    <PageFilterShell
      title={t(`menu.${MENU_CODE}`, { defaultValue: 'L2 분할 그리드 데모' })}
      toolbar={
        <>
          <YearMonthRangeSearchBar
            fromYear={fromYear} fromMonth={fromMonth}
            onFromChange={(y, m) => { setFromYear(y); setFromMonth(m); }}
            toYear={toYear} toMonth={toMonth}
            onToChange={(y, m) => { setToYear(y); setToMonth(m); }}
            onSearch={handleSearch}
          />
          <FilterField label="필터링:">
            <div style={{ display: 'flex', gap: 2 }}>
              <DropdownFilter options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} allLabel="상태 전체" width={100} />
            </div>
          </FilterField>
        </>
      }
      toolbarRight={
        <RefreshButton onRefresh={async () => { notify('(데모) 새로고침', { type: 'success' }); }} />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>

        {/* 상단: 수주 마스터 */}
        <div style={{ flex: '0 0 45%', minHeight: 0, overflow: 'hidden' }}>
          <PeakEditGrid
            gridId={`${MENU_CODE}-master`}
            columns={masterColumns}
            data={displayOrders}
            onBatchSave={async () => {}}
            permission={{ canCreate: false, canUpdate: false, canDelete: false, canExport: perm.canExport }}
          />
        </div>

        {/* 하단: 수주 상세 */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {selectedOrder ? (
            <PeakEditGrid
              gridId={`${MENU_CODE}-detail`}
              columns={detailColumns}
              data={detailData}
              onBatchSave={handleDetailBatchSave}
              permission={perm}
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 6,
            }}>
              상단 수주 목록에서 항목을 선택하세요
            </div>
          )}
        </div>

      </div>
    </PageFilterShell>
  );
}
