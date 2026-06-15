import { useState, useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';

const searchInputStyle: CSSProperties = {
  width: '100%', height: 32, fontSize: 14, padding: '0 8px',
  border: '1px solid var(--color-border, #d1d5db)', borderRadius: 4,
  boxSizing: 'border-box',
};

export interface PickerDialogProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  data: T[];
  columns: ColDef<T>[];
  gridId: string;
  title?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  width?: number | string;
  height?: number | string;
  pageSize?: number;
}

export function PickerDialog<T>({
  open,
  onClose,
  onSelect,
  data,
  columns,
  title = '선택',
  searchPlaceholder = '검색어 입력',
  searchFilter,
  width = 980,
  height = '82vh',
}: PickerDialogProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!searchFilter) return data;
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => searchFilter(item, q));
  }, [search, data, searchFilter]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 8, padding: '20px 24px',
          width, maxWidth: '94vw', height,
          display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
        {searchFilter && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={searchInputStyle}
            autoFocus
          />
        )}
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          총 {filtered.length}건 — 행을 클릭하면 선택됩니다.
        </div>
        <div style={{ flex: 1, minHeight: 0 }} className="ag-theme-alpine">
          <AgGridReact<T>
            rowData={filtered}
            columnDefs={columns}
            defaultColDef={{ resizable: true, sortable: true }}
            rowHeight={32}
            headerHeight={34}
            onRowClicked={(e) => {
              if (e.data) {
                onSelect(e.data);
                onClose();
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="mes-btn" style={{ minWidth: 60 }}>
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
