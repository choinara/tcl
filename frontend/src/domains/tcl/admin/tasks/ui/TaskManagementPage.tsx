import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColDef, ICellRendererParams, RowClassParams } from 'ag-grid-community';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { Modal } from '@/components/ui/Modal';
import { PageTitle } from '@/components/ui/PageTitle';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useCommonCodes, getCodeName } from '@/hooks/useCommonCodes';
import { useToast } from '@/shared/components/toast/useToast';
import type { DevTask, DevTaskStats, DevTaskSchedule } from '../types/devTask.types';

const MENU_CODE = 'AD0010';

function computeStatus(stageCode: string, schedules: DevTaskSchedule[], taskCode: string): string {
  const schedule = schedules.find(s => s.taskCode === taskCode && s.stageCode === stageCode);
  if (!schedule?.stageStart || !schedule?.stageEnd) return '';
  const today = new Date().toISOString().slice(0, 10);
  if (schedule.stageStart > today) return '대기';
  if (schedule.stageEnd < today) return '지연';
  return '진행';
}

export default function TaskManagementPage() {
  const { t } = useTranslation();
  const perm = usePermission(MENU_CODE);
  const { notify } = useToast();
  const gridRef = useRef<PeakEditGridRef>(null);

  // Common codes — TASK_STAGE replaces TASK_STATUS; TASK_STATUS retained for detail modal legacy
  const codes = useCommonCodes('TASK_STAGE', 'TASK_GROUP', 'TASK_DEV_TYPE', 'PRIORITY');
  const stageCodes = useMemo(() => codes['TASK_STAGE'] ?? [], [codes]);
  const groupCodes = useMemo(() => codes['TASK_GROUP'] ?? [], [codes]);
  const devTypeCodes = useMemo(() => codes['TASK_DEV_TYPE'] ?? [], [codes]);
  const priorityCodes = useMemo(() => codes['PRIORITY'] ?? [], [codes]);

  // State
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [schedules, setSchedules] = useState<DevTaskSchedule[]>([]);
  const [stats, setStats] = useState<DevTaskStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [stageFilter, setStageFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DevTask | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/devtask/tasks?useYn=ALL');
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data || []);
      }
    } catch {
      notify(t('message.error.fetchFailed', '조회에 실패했습니다'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await authFetch('/api/devtask/schedules');
      if (res.ok) {
        const json = await res.json();
        setSchedules(json.data || []);
      }
    } catch {
      notify(t('message.error.fetchFailed', 'WBS 일정 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/devtask/tasks/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json.data || null);
      }
    } catch {
      // stats failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchSchedules();
    fetchStats();
  }, [fetchTasks, fetchSchedules, fetchStats]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (stageFilter) {
      result = result.filter(t => t.status === stageFilter);
    }
    if (groupFilter) {
      result = result.filter(t => t.taskGroup === groupFilter);
    }
    if (priorityFilter) {
      result = result.filter(t => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, stageFilter, groupFilter, priorityFilter]);

  // Grid data — enrich with computed status
  const gridData = useMemo<Record<string, unknown>[]>(() => {
    return filteredTasks.map(t => ({
      ...t,
      _computedStatus: computeStatus(t.status, schedules, t.taskCode),
    }));
  }, [filteredTasks, schedules]);

  // Batch save
  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/devtask/tasks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: t('message.error.serverError', '서버 응답을 처리할 수 없습니다') }));
      throw new Error(err?.message || t('message.error.saveFailed', '저장에 실패했습니다'));
    }
    await fetchTasks();
    await fetchStats();
    notify(t('message.success.saved', '저장되었습니다'), { type: 'success' });
  }, [fetchTasks, fetchStats, notify, t]);

  // 상세 모달 열기 (수정 버튼 또는 과제명 더블클릭)
  const handleOpenDetail = useCallback((task: DevTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  // 수정 버튼: 선택된 행의 상세 모달 열기
  const handleEditClick = useCallback(() => {
    const rows = gridRef.current?.getSelectedRows() ?? [];
    if (rows.length === 0) {
      notify(t('message.info.selectRow', '행을 먼저 선택해주세요'), { type: 'info' });
      return;
    }
    handleOpenDetail(rows[0] as unknown as DevTask);
  }, [handleOpenDetail, notify, t]);

  // Row style: 지연 행 적색
  const getRowStyle = useCallback((params: RowClassParams): Record<string, string> | undefined => {
    const computed = (params.data as Record<string, unknown>)?._computedStatus;
    if (computed === '지연') {
      return { background: '#fef2f2', color: '#991b1b' };
    }
    return undefined;
  }, []);

  // Column definitions
  const columns = useMemo(() => {
    const stageValues = stageCodes.map(c => c.code);
    const groupValues = groupCodes.map(c => c.code);
    const devTypeValues = devTypeCodes.map(c => c.code);
    const priorityValues = priorityCodes.map(c => c.code);

    return [
      {
        field: 'taskCode',
        headerName: t('page.devtask.taskCode', '과제코드'),
        width: 80,
        editable: (params) => !params.data?.id,
        headerClass: 'ag-header-required',
      },
      {
        field: 'taskName',
        headerName: t('page.devtask.taskName', '과제명'),
        width: 260,
        editable: false,
        headerClass: 'ag-header-required',
        cellRenderer: (params: ICellRendererParams) => (
          <span
            onDoubleClick={() => params.data && handleOpenDetail(params.data as DevTask)}
            style={{ cursor: 'pointer', display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={t('page.devtask.dblClickDetail', '더블클릭: 상세 보기')}
          >
            {params.value as string}
          </span>
        ),
      },
      {
        field: 'taskGroup',
        headerName: t('page.devtask.taskGroup', '기능그룹'),
        width: 120,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: groupValues },
        valueFormatter: (params) => getCodeName(groupCodes, params.value as string),
      },
      {
        field: 'devType',
        headerName: t('page.devtask.devType', '개발유형'),
        width: 110,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: devTypeValues },
        valueFormatter: (params) => getCodeName(devTypeCodes, params.value as string),
      },
      {
        field: 'priority',
        headerName: t('page.devtask.priority', '우선순위'),
        width: 80,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: priorityValues },
        valueFormatter: (params) => getCodeName(priorityCodes, params.value as string),
      },
      {
        field: 'status',
        headerName: t('page.devtask.stage', '단계'),
        width: 90,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: stageValues },
        valueFormatter: (params) => getCodeName(stageCodes, params.value as string),
        valueSetter: (params) => {
          params.data.status = params.newValue;
          // 단계 변경 시 해당 단계의 WBS 일정을 plannedStart/plannedEnd에 자동 반영
          const schedule = schedules.find(
            s => s.taskCode === (params.data as Record<string, unknown>).taskCode && s.stageCode === params.newValue
          );
          if (schedule) {
            if (schedule.stageStart) params.data.plannedStart = schedule.stageStart;
            if (schedule.stageEnd) params.data.plannedEnd = schedule.stageEnd;
          }
          // 상태 재계산
          params.data._computedStatus = computeStatus(
            params.newValue as string,
            schedules,
            (params.data as Record<string, unknown>).taskCode as string
          );
          return true;
        },
      },
      {
        field: '_computedStatus',
        headerName: t('page.devtask.computedStatus', '상태'),
        width: 70,
        editable: false,
        suppressMovable: false,
        cellStyle: (params) => {
          const v = params.value as string;
          if (v === '지연') return { color: '#dc2626', fontWeight: 600 };
          if (v === '진행') return { color: '#2563eb', fontWeight: 600 };
          if (v === '대기') return { color: '#6b7280' };
          return {};
        },
      },
      {
        field: 'phase',
        headerName: t('page.devtask.phase', 'Phase'),
        width: 90,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['PHASE_1', 'PHASE_2A', 'PHASE_2B', 'PHASE_3'] },
      },
      {
        field: 'assignee',
        headerName: t('page.devtask.assignee', '담당자'),
        width: 90,
        editable: true,
      },
      {
        field: 'proposer',
        headerName: t('page.devtask.proposer', '제안자'),
        width: 90,
        editable: false,
      },
      {
        field: 'plannedStart',
        headerName: t('page.devtask.plannedStart', '예정시작'),
        width: 85,
        editable: true,
        headerClass: 'ag-header-auto',
      },
      {
        field: 'plannedEnd',
        headerName: t('page.devtask.plannedEnd', '예정종료'),
        width: 85,
        editable: true,
        headerClass: 'ag-header-auto',
      },
      {
        field: 'useYn',
        headerName: t('common.useYn', '사용'),
        width: 60,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Y', 'N'] },
        valueFormatter: (params) => params.value === 'Y' ? t('common.yes', '사용') : t('common.no', '미사용'),
        cellStyle: (params) => params.value === 'N' ? { textAlign: 'center', color: '#94a3b8' } : { textAlign: 'center' },
      },
    ] as ColDef<any>[];
  }, [stageCodes, groupCodes, devTypeCodes, priorityCodes, t, handleOpenDetail, schedules]);

  // Filter select style
  const filterStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  if (!perm.canRead) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Stats bar */}
      {stats && (
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          marginBottom: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            {t('page.devtask.stats', '그룹별 현황')}
          </span>
          {stats.byGroup.map(g => (
            <div key={g.group} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#475569',
            }}>
              <span style={{ fontWeight: 500 }}>{g.groupName}</span>
              <div style={{
                width: 60,
                height: 6,
                background: '#e2e8f0',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${g.rate}%`,
                  height: '100%',
                  background: g.rate === 100 ? '#16a34a' : '#3b82f6',
                  borderRadius: 3,
                }} />
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {g.completed}/{g.total}
              </span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            {t('common.total', '전체')}: {stats.total}
          </span>
        </div>
      )}

      {/* Grid */}
      <PeakEditGrid
        ref={gridRef}
        gridId="dev-task-v2"
        columns={columns}
        data={gridData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        permission={perm}
        getRowStyle={getRowStyle}
        extraToolbarButtonsAfterDelete={
          perm.canRead && (
            <button className="mes-btn" onClick={handleEditClick}>
              {t('common.detail', '상세')}
            </button>
          )
        }
        toolbarTitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PageTitle i18nKey={`menu.${MENU_CODE}`} />
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={filterStyle}>
              <option value="">{t('page.devtask.stage', '단계')} ({t('common.all', '전체')})</option>
              {stageCodes.map(c => (
                <option key={c.code} value={c.code}>{c.codeName}</option>
              ))}
            </select>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={filterStyle}>
              <option value="">{t('page.devtask.taskGroup', '그룹')} ({t('common.all', '전체')})</option>
              {groupCodes.map(c => (
                <option key={c.code} value={c.code}>{c.codeName}</option>
              ))}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={filterStyle}>
              <option value="">{t('page.devtask.priority', '우선순위')} ({t('common.all', '전체')})</option>
              {priorityCodes.map(c => (
                <option key={c.code} value={c.code}>{c.codeName}</option>
              ))}
            </select>
            {loading && <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('common.loading', '로딩 중...')}</span>}
          </div>
        }
      />

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={t('page.devtask.detail', '과제 상세')}
      >
        {selectedTask && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 16px', fontSize: 14 }}>
            <DetailField label={t('page.devtask.taskCode', '과제코드')} value={selectedTask.taskCode} />
            <DetailField label={t('page.devtask.taskName', '과제명')} value={selectedTask.taskName} />
            <DetailField label={t('page.devtask.taskGroup', '기능그룹')} value={getCodeName(groupCodes, selectedTask.taskGroup)} />
            <DetailField label={t('page.devtask.devType', '개발유형')} value={getCodeName(devTypeCodes, selectedTask.devType)} />
            <DetailField label={t('page.devtask.priority', '우선순위')} value={getCodeName(priorityCodes, selectedTask.priority)} />
            <DetailField label={t('page.devtask.stage', '단계')} value={getCodeName(stageCodes, selectedTask.status)} />
            <DetailField label={t('page.devtask.phase', 'Phase')} value={selectedTask.phase ?? '-'} />
            <DetailField label={t('page.devtask.proposer', '제안자')} value={selectedTask.proposer ?? '-'} />
            <DetailField label={t('page.devtask.assignee', '담당자')} value={selectedTask.assignee ?? '-'} />
            <DetailField label={t('page.devtask.relatedMenuCode', '관련메뉴')} value={selectedTask.relatedMenuCode ?? '-'} />
            <DetailField label={t('page.devtask.plannedStart', '예정시작')} value={selectedTask.plannedStart ?? '-'} />
            <DetailField label={t('page.devtask.plannedEnd', '예정종료')} value={selectedTask.plannedEnd ?? '-'} />
            <DetailField label={t('page.devtask.actualStartDate', '실제시작')} value={selectedTask.actualStartDate ?? '-'} />
            <DetailField label={t('page.devtask.actualEndDate', '실제완료')} value={selectedTask.actualEndDate ?? '-'} />
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <DetailTextArea label={t('page.devtask.description', '설명')} value={selectedTask.description} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <DetailTextArea label={t('page.devtask.completionCriteria', '완료기준')} value={selectedTask.completionCriteria} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <DetailTextArea label={t('page.devtask.remarks', '비고')} value={selectedTask.remarks} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ fontWeight: 500, color: '#374151' }}>{label}</span>
      <span style={{ color: '#1e293b' }}>{value}</span>
    </>
  );
}

function DetailTextArea({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span style={{ fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</span>
      <div style={{
        padding: '8px 12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        minHeight: 40,
        whiteSpace: 'pre-wrap',
        fontSize: 13,
        color: value ? '#1e293b' : '#94a3b8',
        lineHeight: 1.6,
      }}>
        {value || '-'}
      </div>
    </div>
  );
}
