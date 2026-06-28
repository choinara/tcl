import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColDef } from 'ag-grid-community';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { Modal } from '@/components/ui/Modal';
import { PageTitle } from '@/components/ui/PageTitle';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useCommonCodes, getCodeName } from '@/hooks/useCommonCodes';
import { useToast } from '@/shared/components/toast/useToast';
import type { DevTask, DevTaskStats } from '../types/devTask.types';

const MENU_CODE = 'AD0010';

export default function TaskManagementPage() {
  const { t } = useTranslation();
  const perm = usePermission(MENU_CODE);
  const { notify } = useToast();
  const gridRef = useRef<PeakEditGridRef>(null);

  // Common codes
  const codes = useCommonCodes('TASK_STATUS', 'TASK_GROUP', 'TASK_DEV_TYPE', 'PRIORITY');
  const statusCodes = useMemo(() => codes['TASK_STATUS'] ?? [], [codes]);
  const groupCodes = useMemo(() => codes['TASK_GROUP'] ?? [], [codes]);
  const devTypeCodes = useMemo(() => codes['TASK_DEV_TYPE'] ?? [], [codes]);
  const priorityCodes = useMemo(() => codes['PRIORITY'] ?? [], [codes]);

  // State
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [stats, setStats] = useState<DevTaskStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
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
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter);
    }
    if (groupFilter) {
      result = result.filter(t => t.taskGroup === groupFilter);
    }
    if (priorityFilter) {
      result = result.filter(t => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, statusFilter, groupFilter, priorityFilter]);

  // Grid data (Record<string, unknown>[])
  const gridData = useMemo<Record<string, unknown>[]>(() => {
    return filteredTasks.map(t => ({ ...t }));
  }, [filteredTasks]);

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

  // Row click -> detail modal
  const handleRowClick = useCallback((data: Record<string, unknown>) => {
    const task = data as unknown as DevTask;
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  // Column definitions
  const columns = useMemo<ColDef[]>(() => {
    const statusValues = statusCodes.map(c => c.code);
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
        width: 280,
        editable: true,
        headerClass: 'ag-header-required',
      },
      {
        field: 'taskGroup',
        headerName: t('page.devtask.taskGroup', '기능그룹'),
        width: 130,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: groupValues },
        valueFormatter: (params) => getCodeName(groupCodes, params.value as string),
      },
      {
        field: 'devType',
        headerName: t('page.devtask.devType', '개발유형'),
        width: 120,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: devTypeValues },
        valueFormatter: (params) => getCodeName(devTypeCodes, params.value as string),
      },
      {
        field: 'priority',
        headerName: t('page.devtask.priority', '우선순위'),
        width: 90,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: priorityValues },
        valueFormatter: (params) => getCodeName(priorityCodes, params.value as string),
      },
      {
        field: 'status',
        headerName: t('page.devtask.status', '상태'),
        width: 90,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: statusValues },
        valueFormatter: (params) => getCodeName(statusCodes, params.value as string),
        cellStyle: (params) => {
          const v = params.value as string;
          if (v === 'COMPLETED') return { color: '#16a34a', fontWeight: 600 };
          if (v === 'IN_PROGRESS') return { color: '#2563eb', fontWeight: 600 };
          if (v === 'ON_HOLD') return { color: '#d97706' };
          if (v === 'CANCELLED') return { color: '#94a3b8', textDecoration: 'line-through' };
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
        width: 100,
        editable: true,
      },
      {
        field: 'progress',
        headerName: t('page.devtask.progress', '진행률'),
        width: 80,
        editable: true,
        type: 'numericColumn',
        valueFormatter: (params) => `${params.value ?? 0}%`,
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
        width: 70,
        editable: true,
      },
      {
        field: 'plannedEnd',
        headerName: t('page.devtask.plannedEnd', '예정종료'),
        width: 70,
        editable: true,
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
    ];
  }, [statusCodes, groupCodes, devTypeCodes, priorityCodes, t]);

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
        gridId="dev-task-v1"
        columns={columns}
        data={gridData}
        bodyHeight="fitToParent"
        onBatchSave={handleBatchSave}
        permission={perm}
        onRowClick={handleRowClick}
        toolbarTitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PageTitle menuCode={MENU_CODE} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterStyle}>
              <option value="">{t('page.devtask.status', '상태')} ({t('common.all', '전체')})</option>
              {statusCodes.map(c => (
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
            <DetailField label={t('page.devtask.status', '상태')} value={getCodeName(statusCodes, selectedTask.status)} />
            <DetailField label={t('page.devtask.phase', 'Phase')} value={selectedTask.phase ?? '-'} />
            <DetailField label={t('page.devtask.proposer', '제안자')} value={selectedTask.proposer ?? '-'} />
            <DetailField label={t('page.devtask.assignee', '담당자')} value={selectedTask.assignee ?? '-'} />
            <DetailField label={t('page.devtask.relatedMenuCode', '관련메뉴')} value={selectedTask.relatedMenuCode ?? '-'} />
            <DetailField label={t('page.devtask.plannedStart', '예정시작')} value={selectedTask.plannedStart ?? '-'} />
            <DetailField label={t('page.devtask.plannedEnd', '예정종료')} value={selectedTask.plannedEnd ?? '-'} />
            <DetailField label={t('page.devtask.actualStartDate', '실제시작')} value={selectedTask.actualStartDate ?? '-'} />
            <DetailField label={t('page.devtask.actualEndDate', '실제완료')} value={selectedTask.actualEndDate ?? '-'} />
            <DetailField label={t('page.devtask.progress', '진행률')} value={`${selectedTask.progress}%`} />
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
