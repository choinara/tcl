import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import '@/components/grid/agGridTheme.css';
import { Search } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

export type LookupType = 'customer' | 'product' | 'supplier' | 'material' | 'quotation' | 'salesOrder' | 'receivingVoucher';

interface LookupModalProps {
  open: boolean;
  type: LookupType;
  keyword: string;
  initialRows?: Record<string, unknown>[];
  onSelect: (row: Record<string, unknown>) => void;
  onClose: () => void;
}

const CUSTOMER_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'customerCode', headerName: '거래처코드', width: 120, sortable: true },
  { field: 'customerName', headerName: '거래처명', flex: 1, minWidth: 150 },
  { field: 'businessNo', headerName: '사업자번호', width: 130 },
  { field: 'ceoName', headerName: '대표자명', width: 100 },
  { field: 'phone', headerName: '전화번호', width: 130 },
];

const PRODUCT_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'productCode', headerName: '품목코드', width: 120, sortable: true },
  { field: 'productName', headerName: '품명', flex: 1, minWidth: 150 },
  { field: 'modelType', headerName: '기종', width: 120 },
  { field: 'specification', headerName: '규격', width: 150 },
  { field: 'unit', headerName: '단위', width: 80 },
  { field: 'productType', headerName: '품목유형', width: 100 },
];

const SUPPLIER_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'supplierCode', headerName: '공급사코드', width: 120, sortable: true },
  { field: 'supplierName', headerName: '공급사명', flex: 1, minWidth: 150 },
  { field: 'businessNo', headerName: '사업자번호', width: 130 },
  { field: 'contactPerson', headerName: '담당자', width: 100 },
  { field: 'phone', headerName: '전화번호', width: 130 },
];

const MATERIAL_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'materialCode', headerName: '자재코드', width: 120, sortable: true },
  { field: 'materialName', headerName: '자재명', flex: 1, minWidth: 150 },
  { field: 'materialType', headerName: '자재유형', width: 100 },
  { field: 'specification', headerName: '규격', width: 150 },
  { field: 'unit', headerName: '단위', width: 80 },
];

const SALES_ORDER_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'orderNo', headerName: '수주번호', width: 130, sortable: true },
  { field: 'orderDate', headerName: '수주일자', width: 110 },
  { field: 'customerName', headerName: '거래처명', width: 130 },
  { field: 'productName', headerName: '품명', flex: 1, minWidth: 130 },
  { field: 'totalAmount', headerName: '합계', width: 120, type: 'numericColumn', valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '' },
  { field: 'status', headerName: '상태', width: 90 },
];

const QUOTATION_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'quotationNo', headerName: '견적번호', width: 130, sortable: true },
  { field: 'quotationDate', headerName: '견적일자', width: 110 },
  { field: 'customerName', headerName: '거래처명', width: 130 },
  { field: 'productName', headerName: '품명', flex: 1, minWidth: 130 },
  { field: 'totalAmount', headerName: '합계', width: 120, type: 'numericColumn', valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '' },
  { field: 'status', headerName: '상태', width: 90 },
];

const RECEIVING_VOUCHER_COLUMNS: ColDef[] = [
  { field: 'id', headerName: 'ID', width: 70, sortable: true },
  { field: 'voucherNo', headerName: '전표번호', width: 130, sortable: true },
  { field: 'receivingDate', headerName: '입고일자', width: 110 },
  { field: 'supplierName', headerName: '공급업체명', width: 130 },
  { field: 'totalAmount', headerName: '합계금액', width: 120, type: 'numericColumn', valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '' },
  { field: 'status', headerName: '상태', width: 90 },
];

const LOOKUP_CONFIG: Record<LookupType, {
  title: string;
  columns: ColDef[];
  apiUrl: string;
  placeholder: string;
  displayFn: (row: Record<string, unknown>) => string;
}> = {
  customer: {
    title: '거래처 조회',
    columns: CUSTOMER_COLUMNS,
    apiUrl: '/api/sales/customers',
    placeholder: '거래처코드, 거래처명으로 검색...',
    displayFn: (r) => `${r.customerCode ?? ''} - ${r.customerName ?? ''}`,
  },
  product: {
    title: '품목 조회',
    columns: PRODUCT_COLUMNS,
    apiUrl: '/api/master/products',
    placeholder: '품목코드, 품명으로 검색...',
    displayFn: (r) => `${r.productCode ?? ''} - ${r.productName ?? ''}`,
  },
  supplier: {
    title: '공급사 조회',
    columns: SUPPLIER_COLUMNS,
    apiUrl: '/api/procurement/suppliers',
    placeholder: '공급사코드, 공급사명으로 검색...',
    displayFn: (r) => `${r.supplierCode ?? ''} - ${r.supplierName ?? ''}`,
  },
  material: {
    title: '자재 조회',
    columns: MATERIAL_COLUMNS,
    apiUrl: '/api/master/materials',
    placeholder: '자재코드, 자재명으로 검색...',
    displayFn: (r) => `${r.materialCode ?? ''} - ${r.materialName ?? ''}`,
  },
  quotation: {
    title: '견적 조회',
    columns: QUOTATION_COLUMNS,
    apiUrl: '/api/sales/quotations',
    placeholder: '견적번호, 거래처명으로 검색...',
    displayFn: (r) => `${r.quotationNo ?? ''} - ${r.customerName ?? ''}`,
  },
  salesOrder: {
    title: '수주 조회',
    columns: SALES_ORDER_COLUMNS,
    apiUrl: '/api/sales/orders',
    placeholder: '수주번호, 거래처명으로 검색...',
    displayFn: (r) => `${r.orderNo ?? ''} - ${r.customerName ?? ''}`,
  },
  receivingVoucher: {
    title: '입고전표 조회',
    columns: RECEIVING_VOUCHER_COLUMNS,
    apiUrl: '/api/trade/receiving',
    placeholder: '전표번호, 공급업체명으로 검색...',
    displayFn: (r) => `${r.voucherNo ?? ''} - ${r.supplierName ?? ''}`,
  },
};

export default function LookupModal({ open, type, keyword: initialKeyword, initialRows, onSelect, onClose }: LookupModalProps) {
  const { t } = useTranslation();
  const gridRef = useRef<AgGridReact>(null);
  const [kw, setKw] = useState(initialKeyword);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const config = LOOKUP_CONFIG[type];
  const columnDefs = useMemo(() => config.columns, [config]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    suppressHeaderMenuButton: true,
    minWidth: 60,
  }), []);

  const fetchData = useCallback(async (searchKw: string) => {
    setLoading(true);
    setFetchError(null);
    setSelectedRow(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ size: '100', sort: 'id', direction: 'ASC' });
      if (searchKw.trim()) params.set('keyword', searchKw.trim());
      const res = await authFetch(`${config.apiUrl}?${params}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.content ?? json.data ?? [];
        setRows(list);
        if (list.length === 0) setFetchError('조회 결과가 없습니다.');
      } else {
        setFetchError('조회에 실패했습니다.');
      }
    } catch {
      setFetchError('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [config.apiUrl]);

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setKw(initialKeyword);
      setSelectedRow(null);
      setFetchError(null);
      if (initialRows && initialRows.length > 0) {
        setRows(initialRows);
        setSearched(true);
      } else {
        setRows([]);
        setSearched(false);
        fetchData(initialKeyword);
      }
    }
    prevOpen.current = open;
  }, [open, initialKeyword, initialRows, fetchData]);

  const handleSearch = useCallback(() => {
    fetchData(kw);
  }, [fetchData, kw]);

  const handleRowClick = useCallback((e: RowClickedEvent) => {
    setSelectedRow(e.data);
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedRow) {
      onSelect(selectedRow);
    }
  }, [selectedRow, onSelect]);

  return (
    <Modal open={open} onClose={onClose} title={config.title} wide>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder={config.placeholder}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 6,
            border: '1px solid #d1d5db', fontSize: 'var(--font-size-md)',
          }}
        />
        <button
          className="mes-btn"
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: 6,
            border: '1px solid #d1d5db', background: '#f8fafc',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontWeight: 500,
          }}
        >
          <Search size={15} />
          {t('common.search')}
        </button>
      </div>

      {/* Error message */}
      {fetchError && rows.length === 0 && (
        <div style={{
          padding: '8px 12px', marginBottom: 8, borderRadius: 6,
          background: '#fef2f2', border: '1px solid #fecaca',
          fontSize: 'var(--font-size-base)', color: '#991b1b',
        }}>
          {fetchError}
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-mes" style={{ height: 380, width: '100%', marginBottom: 16 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="single"
          onRowClicked={handleRowClick}
          getRowId={(params) => String(params.data.id)}
          overlayLoadingTemplate='<span style="padding:10px">로딩 중...</span>'
          overlayNoRowsTemplate={searched ? '<span style="padding:10px">조회 결과가 없습니다</span>' : '<span style="padding:10px">검색어를 입력하고 조회하세요</span>'}
          loading={loading}
          rowStyle={{ cursor: 'pointer' }}
          getRowStyle={(params) =>
            params.data?.id === selectedRow?.id
              ? { background: '#dbeafe' }
              : undefined
          }
          onRowDoubleClicked={(e) => {
            setSelectedRow(e.data);
            onSelect(e.data);
          }}
        />
      </div>

      {/* Footer Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          className="mes-btn"
          onClick={onClose}
          style={{
            padding: '8px 16px', borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff',
            cursor: 'pointer',
          }}
        >
          {t('common.cancel')}
        </button>
        <button
          className="mes-btn mes-btn-save"
          onClick={handleSelect}
          disabled={!selectedRow}
          style={{
            padding: '8px 16px', borderRadius: 6,
            cursor: !selectedRow ? 'not-allowed' : 'pointer',
            opacity: !selectedRow ? 0.5 : 1,
          }}
        >
          선택
        </button>
      </div>
    </Modal>
  );
}
