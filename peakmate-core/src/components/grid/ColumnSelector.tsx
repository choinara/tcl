import { useState, useRef, useEffect, useCallback } from 'react';
import type { ColDef } from 'ag-grid-community';

interface ColumnSelectorProps {
  /** 원본 컬럼 정의 (순서 기준) */
  columns: ColDef[];
  /** 현재 숨김 처리된 컬럼 ID 목록 */
  hiddenColumns: string[];
  /** 숨김 목록 변경 시 콜백 */
  onHiddenColumnsChange: (hidden: string[]) => void;
  /** 버튼 라벨 */
  label?: string;
}

const checkboxStyle: React.CSSProperties = {
  accentColor: '#6ba3f7',
  width: 14,
  height: 14,
  margin: 0,
  flexShrink: 0,
  cursor: 'pointer',
};

/**
 * 컬럼 Show/Hide 선택기 (8열 그리드 레이아웃).
 */
export function ColumnSelector({ columns, hiddenColumns, onHiddenColumnsChange, label = '컬럼' }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });

  // 버튼 위치 기준으로 팝오버 위치 계산
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPopoverPos({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 4,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectableColumns = columns.filter((c) => {
    const id = c.field || c.colId || '';
    return id && id !== '__drag' && id !== '__rowNum';
  });

  const allVisible = hiddenColumns.length === 0;

  const handleToggleAll = useCallback(() => {
    if (allVisible) {
      onHiddenColumnsChange(selectableColumns.slice(1).map((c) => c.field || c.colId || ''));
    } else {
      onHiddenColumnsChange([]);
    }
  }, [allVisible, selectableColumns, onHiddenColumnsChange]);

  const handleToggle = useCallback((colId: string) => {
    const isHidden = hiddenColumns.includes(colId);
    if (isHidden) {
      onHiddenColumnsChange(hiddenColumns.filter((id) => id !== colId));
    } else {
      const visibleCount = selectableColumns.length - hiddenColumns.length;
      if (visibleCount <= 1) return;
      onHiddenColumnsChange([...hiddenColumns, colId]);
    }
  }, [hiddenColumns, selectableColumns, onHiddenColumnsChange]);

  const handleReset = useCallback(() => {
    onHiddenColumnsChange([]);
  }, [onHiddenColumnsChange]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="mes-btn"
        title="컬럼 표시/숨김 설정"
        style={hiddenColumns.length > 0 ? { backgroundColor: '#dbeafe', borderColor: '#93c5fd' } : undefined}
      >
        {label}{hiddenColumns.length > 0 ? ` (${selectableColumns.length - hiddenColumns.length}/${selectableColumns.length})` : ''}
      </button>
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: popoverPos.left,
            bottom: popoverPos.bottom,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: 0,
            fontSize: 'var(--grid-font-size, 12px)',
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 헤더: 전체 (좌) + 초기화 (우) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: '#eef3fb',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px 6px 0 0',
            flexShrink: 0,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={allVisible}
                onChange={handleToggleAll}
                style={checkboxStyle}
              />
              전체
            </label>
            <button
              onClick={handleReset}
              className="mes-btn"
              style={{ fontSize: 'var(--font-size-xs, 11px)', padding: '1px 8px', height: 20, lineHeight: '18px' }}
            >
              초기화
            </button>
          </div>
          {/* 8열 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, auto)',
            padding: '6px 4px',
            gap: '2px 0',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}>
            {selectableColumns.map((col) => {
              const colId = col.field || col.colId || '';
              const isHidden = hiddenColumns.includes(colId);
              const headerName = col.headerName || colId;
              return (
                <label
                  key={colId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    borderRadius: 3,
                    transition: 'background 0.1s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--grid-row-hover, #f1f5f9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={!isHidden}
                    onChange={() => handleToggle(colId)}
                    style={checkboxStyle}
                  />
                  <span style={{ opacity: isHidden ? 0.45 : 1 }}>{headerName}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
