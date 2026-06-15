/**
 * [T03] 월별 일자 매트릭스 템플릿
 *
 * 사용 상황: 월별 일자별 계획/실적 입력 — 예) 생산계획, 출하계획, 작업일정
 * 헤더 3단계: 월명(26년 1월) → 주차(W1~W5) → 일자(1~31)
 * 주말 셀(토=파란, 일=빨간) 강조. 월요일 기준 주차 분리.
 *
 * 복사 후 처리:
 *   1. MENU_CODE, API_BASE 교체
 *   2. RowData 인터페이스에 고정 컬럼 필드 추가
 *   3. fixed 컬럼 배열 정의
 *   4. 행 편집 조건(editable) 조정
 *   5. 합계 행 필요 시 buildGridRows() 추가
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageTitle } from '@/components/ui/PageTitle';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';

// TODO: 메뉴코드 + API 경로 교체
const MENU_CODE = 'XX0000';
const API_BASE = '/api/xxx/yyy';

// TODO: 고정 컬럼 필드를 여기에 추가
interface RowData {
  id?: string | number;
  // TODO: 예) lineCode?: string; productName?: string;
  [key: string]: unknown; // d_1 ~ d_31 날짜 컬럼
}

/* ── 날짜 헬퍼 ── */

interface DayMeta {
  field: string;       // d_1, d_2, ..., d_31
  day: number;
  dow: number;         // 0=일, 1=월, ..., 6=토
  isWeekend: boolean;
  weekInMonth: number; // 1~5, 월 내 주차 (월요일 시작)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

/**
 * 월 내 주차 계산 (월요일 시작).
 * 1일이 포함된 주 = W1, 첫 일요일 다음 날부터 W2, ...
 */
function getWeekInMonth(year: number, month: number, day: number): number {
  const firstDow = getDayOfWeek(year, month, 1);
  // 1일이 속한 주의 월요일까지의 오프셋 (0~6)
  const offsetToMonday = firstDow === 0 ? 6 : firstDow - 1;
  return Math.floor((day - 1 + offsetToMonday) / 7) + 1;
}

function buildDayMeta(year: number, month: number): DayMeta[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const dow = getDayOfWeek(year, month, day);
    return {
      field: `d_${day}`,
      day,
      dow,
      isWeekend: dow === 0 || dow === 6,
      weekInMonth: getWeekInMonth(year, month, day),
    };
  });
}

/* ── 컬럼 빌더 ── */

/**
 * 3단 헤더 컬럼 그룹 생성.
 * 반환 구조: { headerName: 'YY년 M월', children: [ W1 group, W2 group, ... ] }
 */
function buildMonthColumnGroup(
  year: number,
  month: number,
  dayMeta: DayMeta[],
): ColGroupDef {
  // 주차별로 DayMeta 그룹핑 (Map은 삽입 순서 보장)
  const weekMap = new Map<number, DayMeta[]>();
  for (const col of dayMeta) {
    if (!weekMap.has(col.weekInMonth)) weekMap.set(col.weekInMonth, []);
    weekMap.get(col.weekInMonth)!.push(col);
  }

  const weekChildren: ColGroupDef[] = [];
  for (const [wk, cols] of weekMap) {
    weekChildren.push({
      headerName: `W${wk}`,
      headerClass: 'ag-header-group-center',
      children: cols.map(
        (col): ColDef => ({
          field: col.field,
          headerName: String(col.day),
          width: 45,
          cellDataType: 'number',
          editable: true, // TODO: 편집 조건 변경 시 (p) => ... 함수로 교체
          headerClass: col.dow === 0
            ? 't03-header-sunday'
            : col.dow === 6
              ? 't03-header-saturday'
              : '',
          cellStyle: () =>
            col.isWeekend ? { backgroundColor: '#fef3e8' } : {},
          valueFormatter: (p) => {
            if (p.value == null || p.value === '') return '';
            const n = Number(p.value);
            return isNaN(n) ? '' : n.toLocaleString();
          },
          valueParser: (p) => {
            if (p.newValue === '' || p.newValue == null) return null;
            const n = Number(p.newValue);
            return isNaN(n) ? null : n;
          },
        }),
      ),
    });
  }

  return {
    headerName: `${year % 100}년 ${month}월`,
    headerClass: 'ag-header-group-center t03-header-month',
    children: weekChildren,
  };
}

/* ── 컴포넌트 ── */

export default function TemplateT03Page() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(MENU_CODE);
  const gridRef = useRef<PeakEditGridRef>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [data, setData] = useState<RowData[]>([]);

  const dayMeta = useMemo(() => buildDayMeta(year, month), [year, month]);

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('조회 실패');
      const json = await res.json();
      setData(json.data?.content ?? json.data ?? []);
    } catch (e) {
      notify(e instanceof Error ? e.message : '조회 중 오류가 발생했습니다', { type: 'error' });
    }
  }, [year, month, notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo<(ColDef | ColGroupDef)[]>(() => {
    // TODO: 고정 컬럼 추가 (pinned: 'left' 권장)
    const fixed: ColDef<RowData>[] = [
      {
        field: 'id',
        headerName: 'ID',
        width: 60,
        pinned: 'left',
        editable: false,
      },
      // TODO: 예) { field: 'lineCode', headerName: 'Line', width: 70, pinned: 'left', editable: false },
      // TODO: 예) { field: 'productName', headerName: '제품', width: 100, pinned: 'left', editable: false },
    ];

    const monthGroup = buildMonthColumnGroup(year, month, dayMeta);

    return [...fixed, monthGroup];
  }, [year, month, dayMeta]);

  const handleBatchSave = useCallback(
    async (rows: { _rowState: string; [key: string]: unknown }[]) => {
      const res = await authFetch(`${API_BASE}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, rows }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message ?? '저장에 실패했습니다.');
      }
      await fetchData();
      notify('저장되었습니다', { type: 'success' });
    },
    [year, month, fetchData, notify],
  );

  const selectStyle: React.CSSProperties = {
    height: 28,
    fontSize: 'var(--font-size-sm)',
    padding: '0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, overflow: 'hidden' }}>
      {/* 조회 조건 */}
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PageTitle />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={selectStyle}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={selectStyle}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
        {/* TODO: 우측 버튼 추가 시 여기에 */}
      </div>

      {/* 그리드 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <PeakEditGrid
          ref={gridRef}
          gridId={`${MENU_CODE}-t03`}
          columns={columns}
          data={data}
          onBatchSave={handleBatchSave}
          hideRowNumber
          autoHeight
          permission={perm}
          excelFileName={`${t(`menu.${MENU_CODE}`)}_${year}년${month}월`}
          // TODO: 행 추가/삭제 버튼 필요 시 extraToolbarButtons 사용
        />
      </div>

      {/* 헤더 색상 CSS */}
      <style>{`
        .t03-header-sunday .ag-header-cell-label { color: #e11d48 !important; }
        .t03-header-saturday .ag-header-cell-label { color: #2563eb !important; }
        .t03-header-month .ag-header-group-cell-label,
        .ag-header-group-center .ag-header-group-cell-label {
          justify-content: center !important;
        }
      `}</style>
    </div>
  );
}
