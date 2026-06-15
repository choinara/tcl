/**
 * [T05] 세로통합 멀티헤더 매트릭스
 *
 * 사용 상황: 설비/공정/호기 단위 × 서브행(PM일정·가동시간·제품별) × 날짜 축 매트릭스
 * 대표 메뉴: APS 주간생산계획(PM0043형), 주간재고계획
 *
 * 핵심 패턴:
 *   - 그룹 컬럼(도금호기 등) 세로 rowspan (groupRowSpan)
 *   - 날짜 기반 동적 ColGroupDef (기본 7일, 변경 가능)
 *   - 서브행 유형별 색상 코딩 (RowType → ROW_BG)
 *   - 근무조/교대 pinnedTopRowData
 *   - 우측 주간합계 + 비고 pinned right
 *   - suppressRowTransform: rowSpan 렌더링에 필수 — 절대 제거 금지
 *
 * 복사 후 처리:
 *   1. MENU_CODE 교체
 *   2. RowType 서브행 유형 목록 수정
 *   3. MatrixRow 타입 필드 수정
 *   4. ROW_BG 색상 조정
 *   5. buildMockRows → fetchRows(weekStart) API 조회로 교체
 *   6. buildMockPinned → 교대 스케줄 API 조회로 교체 (불필요 시 pinnedTopRowData 제거)
 *   7. columnDefs 고정 좌측 컬럼명 / 날짜 소제목 교체
 *   8. 편집 필요 시 valueSetter 주석 해제
 */

import { useRef, useMemo, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type {
  ColDef,
  ColGroupDef,
  RowClassParams,
  RowSpanParams,
  ValueGetterParams,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { RefreshButton } from '@/components/ui/RefreshButton';

// ─── 상수 ─────────────────────────────────────────────────
const MENU_CODE = 'XX0000'; // TODO: 실제 메뉴코드 교체
const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const WEEK_SIZE = 7; // TODO: 다른 날짜 범위 필요 시 변경

// ─── 타입 ─────────────────────────────────────────────────
// TODO: 실제 서브행 유형으로 수정
type RowType =
  | 'pm_content'     // PM 내용
  | 'pm_std_time'    // PM 표준시간(H)
  | 'pm_time_range'  // PM 시작–종료
  | 'work_hours'     // 가동 가능 시간(H)
  | 'product'        // 제품별 생산량
  | 'summary';       // 그룹 소계

interface MatrixRow {
  id: string;
  // 그룹 컬럼 (세로 rowspan 적용)
  groupId: string;
  groupLabel: string;       // P#3호, P#4호, S#2 …
  groupRowSpan?: number;    // 그룹 첫 서브행에만 지정, 나머지는 undefined
  // PM 일정 서브그룹 컬럼 (pm_ 행들을 묶는 레이블)
  pmGroupLabel?: string;    // 'PM 일정' or ''
  pmGroupRowSpan?: number;  // pm_content 첫 행에만 지정 (PM 서브행 개수)
  // 서브행 정보
  rowType: RowType;
  rowLabel: string;         // PM내용 / 표준시간(H) / 제품코드·규격 등
  code?: string;            // 제품 코드
  capacity?: number;        // 생산량(kg/hr)
  // 날짜별 값: yyyy-MM-dd → 표시값
  daily: Record<string, string | number | null>;
  // 집계 / 비고
  weeklyTotal?: number | string;
  note?: string;
}

// ─── 행 유형별 배경색 ─────────────────────────────────────
// TODO: 실제 디자인에 맞게 색상 조정
const ROW_BG: Record<RowType, string> = {
  pm_content:    '#ffffff', // PM 일정
  pm_std_time:   '#ffffff',
  pm_time_range: '#ffffff',
  work_hours:    '#e3f2fd', // 연파랑 — 가동 가능 시간
  product:       '#ffffff', // 제품별 생산량
  summary:       '#f5f5f5', // 소계
};

// ─── 목업 데이터 ──────────────────────────────────────────
// TODO: 실제 구현 시 fetchRows(weekStart) API 조회로 교체
function buildMockRows(dates: string[]): MatrixRow[] {
  const empty = (): Record<string, null> =>
    Object.fromEntries(dates.map(d => [d, null]));

  return [
    // P#3호 그룹 — 서브행 5개(PM 3행 + 가동 1행 + 제품 1행)
    {
      id: 'p3_pm1', groupId: 'p3', groupLabel: 'P#3호', groupRowSpan: 5,
      pmGroupLabel: 'PM 일정', pmGroupRowSpan: 3,
      rowType: 'pm_content', rowLabel: 'PM내용',
      daily: { ...empty(), [dates[0]]: '비가동', [dates[4]]: '반건식' },
    },
    {
      id: 'p3_pm2', groupId: 'p3', groupLabel: '', pmGroupLabel: '',
      rowType: 'pm_std_time', rowLabel: '표준시간(H)',
      daily: { ...empty(), [dates[2]]: 6.0 },
    },
    {
      id: 'p3_pm3', groupId: 'p3', groupLabel: '', pmGroupLabel: '',
      rowType: 'pm_time_range', rowLabel: '시작–종료',
      daily: { ...empty(), [dates[2]]: '07:00–13:00' },
    },
    {
      id: 'p3_wh', groupId: 'p3', groupLabel: '', pmGroupLabel: '',
      rowType: 'work_hours', rowLabel: '가동 가능 시간(H)',
      daily: Object.fromEntries(dates.map(d => [d, 24.0])),
    },
    {
      id: 'p3_cq8', groupId: 'p3', groupLabel: '', pmGroupLabel: '',
      rowType: 'product', code: 'CQ8', capacity: 77.41, rowLabel: '0245 밀반동',
      daily: Object.fromEntries(dates.map(d => [d, 1857.9])),
      weeklyTotal: 12541.1,
    },

    // P#4호 그룹 — 서브행 3개(PM 2행 + 가동 1행)
    {
      id: 'p4_pm1', groupId: 'p4', groupLabel: 'P#4호', groupRowSpan: 3,
      pmGroupLabel: 'PM 일정', pmGroupRowSpan: 2,
      rowType: 'pm_content', rowLabel: 'PM내용',
      daily: { ...empty(), [dates[1]]: '개발샘플 0345' },
      note: '5/12 개발 샘플 생산 예정 0345전해크롬 250kg',
    },
    {
      id: 'p4_pm2', groupId: 'p4', groupLabel: '', pmGroupLabel: '',
      rowType: 'pm_std_time', rowLabel: '표준시간(H)',
      daily: Object.fromEntries(dates.map(d => [d, 24.0])),
    },
    {
      id: 'p4_wh', groupId: 'p4', groupLabel: '', pmGroupLabel: '',
      rowType: 'work_hours', rowLabel: '가동 가능 시간(H)',
      daily: Object.fromEntries(dates.map(d => [d, 0.0])),
    },

    // S#2 그룹 — 서브행 4개(PM 3행 + 가동 1행)
    {
      id: 's2_pm1', groupId: 's2', groupLabel: 'S#2', groupRowSpan: 4,
      pmGroupLabel: 'PM 일정', pmGroupRowSpan: 3,
      rowType: 'pm_content', rowLabel: 'PM내용',
      daily: { ...empty(), [dates[3]]: '주간 전체제가TEST\n종료후 양산가동' },
    },
    {
      id: 's2_pm2', groupId: 's2', groupLabel: '', pmGroupLabel: '',
      rowType: 'pm_std_time', rowLabel: '표준시간(H)',
      daily: Object.fromEntries(dates.map(d => [d, 24.0])),
    },
    {
      id: 's2_pm3', groupId: 's2', groupLabel: '', pmGroupLabel: '',
      rowType: 'pm_time_range', rowLabel: '시작–종료',
      daily: { ...empty(), [dates[3]]: '07:00–15:00' },
    },
    {
      id: 's2_wh', groupId: 's2', groupLabel: '', pmGroupLabel: '',
      rowType: 'work_hours', rowLabel: '가동 가능 시간(H)',
      daily: { ...empty(), [dates[3]]: 16.0, [dates[4]]: 24.0, [dates[5]]: 24.0, [dates[6]]: 24.0 },
    },
  ];
}

// 근무조 pinnedTopRowData
// TODO: 교대 스케줄 API 조회로 교체. 불필요 시 pinnedTopRowData prop 제거
function buildMockPinned(dates: string[]): MatrixRow[] {
  const shifts = [
    { label: '주간', values: ['C', 'B', 'B', 'B', 'B', 'A', 'A'] },
    { label: '야간', values: ['A', 'A', 'A', 'C', 'C', 'C', 'C'] },
  ] as const;
  return shifts.map(s => ({
    id: `shift_${s.label}`,
    groupId: '__shift__',
    groupLabel: '근무조',
    rowType: 'pm_content' as RowType,
    rowLabel: s.label,
    daily: Object.fromEntries(dates.map((d, i) => [d, s.values[i]])),
  }));
}

// ─── 컴포넌트 ──────────────────────────────────────────────
interface TemplateT05Props {
  menuCode?: string; // 데모 페이지에서 TS0060 등 실제 코드를 주입하기 위해 사용
}

export default function TemplateT05Page({ menuCode = MENU_CODE }: TemplateT05Props) {
  const { t } = useTranslation();
  const { notify } = useToast();
  const perm = usePermission(menuCode);
  const gridRef = useRef<AgGridReact<MatrixRow>>(null);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  // 날짜 배열 (weekStart 기준 WEEK_SIZE일)
  const dates = useMemo(
    () => Array.from({ length: WEEK_SIZE }, (_, i) =>
      format(addDays(weekStart, i), 'yyyy-MM-dd'),
    ),
    [weekStart],
  );

  // TODO: 실제 API 조회로 교체
  const rowData = useMemo(() => buildMockRows(dates), [dates]);
  const pinnedTopRowData = useMemo(() => buildMockPinned(dates), [dates]);

  // ── 컬럼 정의 ──────────────────────────────────────────────
  const columnDefs = useMemo((): (ColDef<MatrixRow> | ColGroupDef<MatrixRow>)[] => {
    // 날짜 동적 컬럼 그룹
    const dateCols: ColGroupDef<MatrixRow>[] = dates.map(dateStr => {
      const dow = parseISO(dateStr).getDay();
      const isWeekend = dow === 0 || dow === 6;
      return {
        headerName: `${format(parseISO(dateStr), 'M/d')} ${WEEK_DAYS[dow]}`,
        headerClass: isWeekend ? 'ag-header-weekend' : undefined,
        children: [
          {
            colId: `daily_${dateStr}`,
            headerName: '생산량(D)', // TODO: 실제 값 소제목으로 교체
            width: 90,
            valueGetter: (p: ValueGetterParams<MatrixRow>) =>
              p.data?.daily[dateStr] ?? '',
            // TODO: 셀 직접 편집 허용 시 아래 주석 해제
            // editable: true,
            // valueSetter: (p) => {
            //   if (p.data) p.data.daily[dateStr] = p.newValue;
            //   return true;
            // },
          } as ColDef<MatrixRow>,
        ],
      };
    });

    return [
      // ── 고정 좌측 컬럼 ────────────────────────────────────────
      {
        colId: 'groupLabel',
        field: 'groupLabel',
        headerName: '도금호기', // TODO: 그룹 축 이름 교체
        width: 90,
        pinned: 'left',
        rowSpan: (p: RowSpanParams<MatrixRow>) => p.data?.groupRowSpan ?? 1,
        cellClassRules: {
          'cell-row-span': p => (p.data?.groupRowSpan ?? 1) > 1,
        },
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
        },
      },
      // PM 일정 서브그룹 레이블 — PM 서브행(pm_content/pm_std_time/pm_time_range)을 묶는 rowspan 컬럼
      {
        colId: 'pmGroupLabel',
        field: 'pmGroupLabel',
        headerName: 'PM 일정',
        width: 70,
        pinned: 'left',
        rowSpan: (p: RowSpanParams<MatrixRow>) => p.data?.pmGroupRowSpan ?? 1,
        cellClassRules: {
          'cell-row-span': p => (p.data?.pmGroupRowSpan ?? 1) > 1,
        },
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        valueGetter: (p: ValueGetterParams<MatrixRow>) => p.data?.pmGroupLabel ?? '',
      },
      {
        field: 'code',
        headerName: 'CODE',
        width: 70,
        pinned: 'left',
        valueGetter: (p: ValueGetterParams<MatrixRow>) => p.data?.code ?? '',
      },
      {
        field: 'capacity',
        headerName: '생산량\n(kg/hr)', // TODO: 단위 교체
        width: 80,
        pinned: 'left',
        valueGetter: (p: ValueGetterParams<MatrixRow>) =>
          p.data?.capacity != null ? p.data.capacity.toFixed(2) : '',
      },
      {
        field: 'rowLabel',
        headerName: '구분', // TODO: 서브행 설명 컬럼명 교체
        width: 150,
        pinned: 'left',
      },

      // ── 날짜 동적 그룹 ────────────────────────────────────────
      ...dateCols,

      // ── 우측 컬럼 ────────────────────────────────────────
      {
        field: 'weeklyTotal',
        headerName: '주간생산량\n합계', // TODO: 집계 컬럼명 교체
        width: 100,
        cellStyle: { fontWeight: 'bold', textAlign: 'right' },
      },
      {
        field: 'note',
        headerName: '비고',
        flex: 1,
        minWidth: 160,
        editable: perm.canUpdate,
        cellStyle: { color: '#c00' },
      },
    ];
  }, [dates, perm.canUpdate]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: 'center', fontSize: 'var(--font-size-sm)' },
    }),
    [],
  );

  const getRowStyle = useCallback(
    (p: RowClassParams<MatrixRow>) => ({
      background: ROW_BG[p.data?.rowType ?? 'product'],
    }),
    [],
  );

  const handlePrevWeek = useCallback(() => {
    setWeekStart(d => addDays(d, -WEEK_SIZE));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart(d => addDays(d, WEEK_SIZE));
  }, []);

  const handleWeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const d = parseISO(e.target.value);
      setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    // TODO: 실제 API 재조회 함수 호출로 교체
    notify('새로고침 (TODO: API 연결)', { type: 'info' });
  }, [notify]);

  const weekLabel = `${format(weekStart, 'yyyy-MM-dd')} ~ ${format(addDays(weekStart, WEEK_SIZE - 1), 'yyyy-MM-dd')}`;

  return (
    <PageFilterShell
      title={t(`menu.${menuCode}`)}
      toolbar={
        // TODO: 전용 WeekRangePicker 컴포넌트 완성 시 교체
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="mes-btn" onClick={handlePrevWeek} title="이전 주">{'<'}</button>
          <input
            type="date"
            value={format(weekStart, 'yyyy-MM-dd')}
            onChange={handleWeekInput}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '2px 8px', fontSize: 13 }}
          />
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {weekLabel}
          </span>
          <button className="mes-btn" onClick={handleNextWeek} title="다음 주">{'>'}</button>
        </div>
      }
      toolbarRight={<RefreshButton onRefresh={handleRefresh} />}
    >
      {/*
        suppressRowTransform: rowSpan 정상 렌더링을 위해 필수.
        이 옵션이 없으면 CSS transform 기반 행 배치와 rowSpan 계산이 충돌함.
      */}
      <div
        className="ag-theme-mes t05-grid"
        style={{ height: '100%', width: '100%' }}
      >
        <AgGridReact<MatrixRow>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedTopRowData={pinnedTopRowData}
          getRowStyle={getRowStyle}
          rowHeight={32}
          headerHeight={40}
          suppressRowTransform
          suppressRowVirtualisation
          reactiveCustomComponents
          onGridReady={() => {
            // 초기 로드 시 추가 처리 필요하면 여기서
          }}
        />
      </div>
    </PageFilterShell>
  );
}
