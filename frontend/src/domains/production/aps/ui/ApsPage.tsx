import { useState, useMemo, useCallback, useRef } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { AllCommunityModule, ModuleRegistry, type ColDef, type GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
ModuleRegistry.registerModules([AllCommunityModule]);
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';

/* ---- Types ---- */

interface PlanItem {
  planId: number;
  periodStart: string;
  periodEnd: string;
  lineCodes: string;
  status: string;
  scheduleCount: number;
  createdAt: string;
  createdBy: string;
}

interface ScheduleItem {
  draftId: number;
  lineCode: string;
  planDate: string;
  shift: string;
  crew: string;
  workerCount: number;
  productCode: string;
  plannedQty: number;
  taktTime: number;
  startTime: string;
  endTime: string;
  sortOrder: number;
  remark: string;
}

/* ---- 상수 ---- */

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  CONFIRMED: '확정',
  CANCELLED: '취소',
  REVISED: '수정',
};

const SHIFT_LABEL: Record<string, string> = { DAY: '주간', NIGHT: '야간' };
const CREW_LABEL: Record<string, string> = { CREW_A: 'A조', CREW_B: 'B조', CREW_C: 'C조' };

/* ---- 목업 스케줄 생성 헬퍼 ---- */

function makeSchedules(
  planId: number,
  dates: string[],
  offset: number = 0,
): ScheduleItem[] {
  const P3E_CREW = ['CREW_A', 'CREW_B', 'CREW_C'];
  const P3F_CREW = ['CREW_B', 'CREW_C', 'CREW_A'];
  const rows: ScheduleItem[] = [];
  let id = planId * 100;

  dates.forEach((date, di) => {
    const crewIdx = (di + offset) % 3;
    const nextDate = (() => {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    // P3-E: 8m/s → 77.41 kg/hr × 12hr = 928.92 kg, takt = 0.7751 min/kg
    rows.push({
      draftId: ++id, lineCode: 'P3-E', planDate: date,
      shift: 'DAY', crew: P3E_CREW[crewIdx],
      workerCount: 4, productCode: 'CQ8',
      plannedQty: 928.92, taktTime: 0.7751,
      startTime: `${date} 08:00`, endTime: `${date} 20:00`,
      sortOrder: rows.length + 1, remark: '',
    });
    rows.push({
      draftId: ++id, lineCode: 'P3-E', planDate: date,
      shift: 'NIGHT', crew: P3E_CREW[(crewIdx + 1) % 3],
      workerCount: 4, productCode: 'CQ8',
      plannedQty: 928.92, taktTime: 0.7751,
      startTime: `${date} 20:00`, endTime: `${nextDate} 08:00`,
      sortOrder: rows.length + 1, remark: '',
    });

    // P3-F: 6m/s → 40.82 kg/hr × 12hr = 489.84 kg, takt = 1.4698 min/kg
    rows.push({
      draftId: ++id, lineCode: 'P3-F', planDate: date,
      shift: 'DAY', crew: P3F_CREW[crewIdx],
      workerCount: 4, productCode: '4C4_S',
      plannedQty: 489.84, taktTime: 1.4698,
      startTime: `${date} 08:00`, endTime: `${date} 20:00`,
      sortOrder: rows.length + 1, remark: '',
    });
    rows.push({
      draftId: ++id, lineCode: 'P3-F', planDate: date,
      shift: 'NIGHT', crew: P3F_CREW[(crewIdx + 1) % 3],
      workerCount: 4, productCode: '4C4_S',
      plannedQty: 489.84, taktTime: 1.4698,
      startTime: `${date} 20:00`, endTime: `${nextDate} 08:00`,
      sortOrder: rows.length + 1, remark: '',
    });
  });

  return rows;
}

const WEEK1 = ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16'];
const WEEK2 = ['2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23'];

const INIT_PLANS: PlanItem[] = [
  {
    planId: 1, periodStart: '2026-05-12', periodEnd: '2026-05-16',
    lineCodes: 'P3-E, P3-F', status: 'CONFIRMED', scheduleCount: 20,
    createdAt: '2026-05-11 09:00', createdBy: 'admin',
  },
  {
    planId: 2, periodStart: '2026-05-19', periodEnd: '2026-05-23',
    lineCodes: 'P3-E, P3-F', status: 'DRAFT', scheduleCount: 20,
    createdAt: '2026-05-13 10:30', createdBy: 'admin',
  },
];

const INIT_SCHEDULES: Record<number, ScheduleItem[]> = {
  1: makeSchedules(1, WEEK1, 0),
  2: makeSchedules(2, WEEK2, 1),
};

/* ---- Component ---- */

export default function ApsPage() {
  const perm = usePermission('PM0040');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const planGridRef = useRef<AgGridReact<PlanItem>>(null);

  const [plans, setPlans] = useState<PlanItem[]>(INIT_PLANS);
  const [scheduleMap, setScheduleMap] = useState<Record<number, ScheduleItem[]>>(INIT_SCHEDULES);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [lineCodesInput, setLineCodesInput] = useState('P3-E,P3-F');

  const schedules = useMemo(
    () => (selectedPlanId ? (scheduleMap[selectedPlanId] ?? []) : []),
    [selectedPlanId, scheduleMap],
  );

  const selectedPlan = useMemo(
    () => plans.find(p => p.planId === selectedPlanId),
    [plans, selectedPlanId],
  );

  const handleSelectPlan = useCallback((planId: number) => {
    setSelectedPlanId(planId);
  }, []);

  /* 계획 실행 (목업) */
  const handleRunPlanning = useCallback(async () => {
    if (!periodStart || !periodEnd || !lineCodesInput.trim()) {
      notify('기간과 호기를 모두 입력해주세요.', { type: 'warning' });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // 계획 실행 시뮬레이션
    setLoading(false);

    const newId = Math.max(...plans.map(p => p.planId)) + 1;
    const lines = lineCodesInput.split(',').map(s => s.trim()).filter(Boolean);

    // 기간의 날짜 목록 생성 (평일만)
    const dates: string[] = [];
    const cur = new Date(periodStart);
    const end = new Date(periodEnd);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const newPlan: PlanItem = {
      planId: newId,
      periodStart, periodEnd,
      lineCodes: lines.join(', '),
      status: 'DRAFT',
      scheduleCount: dates.length * lines.length * 2,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdBy: 'admin',
    };

    const newSchedules = makeSchedules(newId, dates, newId % 3);

    setPlans(prev => [...prev, newPlan]);
    setScheduleMap(prev => ({ ...prev, [newId]: newSchedules }));
    setSelectedPlanId(newId);
    notify(`목업 계획 생성 완료 (Plan #${newId}, ${newSchedules.length}건)`, { type: 'success' });
  }, [periodStart, periodEnd, lineCodesInput, notify, plans]);

  /* 확정 */
  const handleCommit = useCallback(async () => {
    if (!selectedPlanId) return;
    if (!await confirmDialog('선택한 계획을 확정하시겠습니까?')) return;
    setPlans(prev => prev.map(p =>
      p.planId === selectedPlanId ? { ...p, status: 'CONFIRMED' } : p,
    ));
    notify('계획이 확정되었습니다 (목업).', { type: 'success' });
  }, [selectedPlanId, confirmDialog, notify]);

  /* 취소 */
  const handleCancel = useCallback(async () => {
    if (!selectedPlanId) return;
    if (!await confirmDialog('선택한 계획을 취소하시겠습니까?')) return;
    setPlans(prev => prev.map(p =>
      p.planId === selectedPlanId ? { ...p, status: 'CANCELLED' } : p,
    ));
    notify('계획이 취소되었습니다 (목업).', { type: 'info' });
  }, [selectedPlanId, confirmDialog, notify]);

  /* 재계획 */
  const handleRevise = useCallback(async () => {
    if (!selectedPlanId) return;
    const base = plans.find(p => p.planId === selectedPlanId);
    if (!base) return;

    const newId = Math.max(...plans.map(p => p.planId)) + 1;
    const newPlan: PlanItem = {
      ...base,
      planId: newId,
      status: 'DRAFT',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    const baseSchedules = scheduleMap[selectedPlanId] ?? [];
    const newSchedules = baseSchedules.map((s, i) => ({ ...s, draftId: newId * 100 + i }));

    setPlans(prev => prev.map(p =>
      p.planId === selectedPlanId ? { ...p, status: 'REVISED' } : p,
    ).concat(newPlan));
    setScheduleMap(prev => ({ ...prev, [newId]: newSchedules }));
    setSelectedPlanId(newId);
    notify(`재계획 완료 (Plan #${newId}) (목업).`, { type: 'success' });
  }, [selectedPlanId, plans, scheduleMap, notify]);

  /* 컬럼 정의 */
  const planColumns = useMemo<ColDef[]>(() => [
    { field: 'planId', headerName: 'ID', width: 55 },
    { field: 'periodStart', headerName: '시작일', width: 105 },
    { field: 'periodEnd', headerName: '종료일', width: 105 },
    { field: 'lineCodes', headerName: '호기', width: 110 },
    {
      field: 'status', headerName: '상태', width: 80,
      valueFormatter: (p) => STATUS_LABEL[p.value as string] ?? p.value,
      cellStyle: (p) => {
        const s = p.value as string;
        if (s === 'CONFIRMED') return { color: '#16a34a', fontWeight: 600 };
        if (s === 'CANCELLED') return { color: '#dc2626', fontWeight: 600 };
        if (s === 'REVISED')   return { color: '#9333ea', fontWeight: 600 };
        return { color: '#2563eb' };
      },
    },
    { field: 'scheduleCount', headerName: '스케줄수', width: 85 },
    { field: 'createdBy', headerName: '작성자', width: 80 },
    { field: 'createdAt', headerName: '작성일시', flex: 1, minWidth: 130 },
  ], []);

  const scheduleColumns = useMemo<ColDef[]>(() => [
    { field: 'lineCode', headerName: '호기', width: 80 },
    { field: 'planDate', headerName: '일자', width: 105 },
    {
      field: 'shift', headerName: '교대', width: 75,
      valueFormatter: (p) => SHIFT_LABEL[p.value as string] ?? p.value,
    },
    {
      field: 'crew', headerName: '작업조', width: 75,
      valueFormatter: (p) => CREW_LABEL[p.value as string] ?? p.value,
    },
    { field: 'workerCount', headerName: '인원', width: 65 },
    { field: 'productCode', headerName: '제품코드', width: 100 },
    {
      field: 'plannedQty', headerName: '계획생산량(kg)', width: 130,
      valueFormatter: (p) => p.value != null
        ? Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '',
    },
    {
      field: 'taktTime', headerName: 'Takt(min/kg)', width: 120,
      valueFormatter: (p) => p.value != null ? Number(p.value).toFixed(4) : '',
    },
    { field: 'startTime', headerName: '시작', width: 140 },
    { field: 'endTime', headerName: '종료', width: 140 },
    { field: 'remark', headerName: '비고', flex: 1, minWidth: 80 },
  ], []);

  const handlePlanGridReady = useCallback((e: GridReadyEvent<PlanItem>) => {
    e.api.sizeColumnsToFit();
  }, []);

  const inputStyle: React.CSSProperties = {
    height: 30, fontSize: 'var(--font-size-sm)', padding: '0 8px',
    border: '1px solid var(--color-border)', borderRadius: 4, background: '#fff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PageTitle />
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                 style={inputStyle} title="계획 시작일" />
          <span style={{ fontSize: 13 }}>~</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                 style={inputStyle} title="계획 종료일" />
          <input type="text" value={lineCodesInput} onChange={e => setLineCodesInput(e.target.value)}
                 placeholder="호기 (P3-E,P3-F,...)" style={{ ...inputStyle, width: 160 }} />
          {perm.canCreate && (
            <button onClick={handleRunPlanning} className="mes-btn mes-btn-save" disabled={loading}>
              {loading ? '계획 중...' : '계획 실행'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {perm.canApprove && selectedPlan?.status === 'DRAFT' && (
            <button onClick={handleCommit} className="mes-btn mes-btn-save">확정</button>
          )}
          {perm.canApprove && selectedPlan?.status === 'CONFIRMED' && (
            <button onClick={handleCancel} className="mes-btn mes-btn-delete">취소</button>
          )}
          {perm.canCreate && selectedPlan?.status === 'CONFIRMED' && (
            <button onClick={handleRevise} className="mes-btn">재계획</button>
          )}
        </div>
      </div>

      {/* 계획 목록 */}
      <div style={{ height: 220, overflow: 'hidden' }} className="ag-theme-mes">
        <AgGridReact<PlanItem>
          ref={planGridRef}
          rowData={plans}
          columnDefs={planColumns}
          onGridReady={handlePlanGridReady}
          onRowClicked={e => e.data && handleSelectPlan(e.data.planId)}
          getRowStyle={p => p.data?.planId === selectedPlanId ? { background: '#dbeafe' } : undefined}
          rowSelection="single"
          suppressCellFocus
          headerHeight={32}
          rowHeight={28}
          style={{ height: '100%' }}
        />
      </div>

      {/* 스케줄 상세 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {selectedPlanId ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '4px 8px', fontSize: 'var(--font-size-base)',
              fontWeight: 600, color: 'var(--color-text)', flexShrink: 0,
            }}>
              스케줄 목록 (Plan #{selectedPlanId}
              {selectedPlan ? ` — ${STATUS_LABEL[selectedPlan.status] ?? selectedPlan.status}` : ''})
              <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                총 {schedules.length}건 |
                P3-E {schedules.filter(s => s.lineCode === 'P3-E').length}건 /
                P3-F {schedules.filter(s => s.lineCode === 'P3-F').length}건
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }} className="ag-theme-mes">
              <AgGridReact<ScheduleItem>
                rowData={schedules}
                columnDefs={scheduleColumns}
                suppressCellFocus
                headerHeight={32}
                rowHeight={28}
                style={{ height: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#94a3b8', fontSize: 14,
          }}>
            위 목록에서 계획을 선택하세요.
          </div>
        )}
      </div>

      <ConfirmDialog />
    </div>
  );
}
