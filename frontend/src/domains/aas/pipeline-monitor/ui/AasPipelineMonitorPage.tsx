import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { authFetch } from '@/lib/api';
import PipelineTopologyChart from '../components/PipelineTopologyChart';
import type { PipelineStatus, EdgeStatus, PendingItem } from '../../shared/types';

const MENU_CODE = 'AA0090';
const API = '/api/opcua/pipeline';

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export default function AasPipelineMonitorPage() {
  const perm = usePermission(MENU_CODE);
  const { notify } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();

  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [edges, setEdges] = useState<EdgeStatus[]>([]);
  const [pendings, setPendings] = useState<PendingItem[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [pendingPage, setPendingPage] = useState(0);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [deletingDead, setDeletingDead] = useState(false);

  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await authFetch(`${API}/status`);
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data ?? json);
      }
    } catch {
      notify(t('page.aas.pipeline.topology') + ' 조회 실패', { type: 'error' });
    }
  };

  const fetchEdges = async () => {
    try {
      const res = await authFetch(`${API}/edges`);
      if (res.ok) {
        const json = await res.json();
        setEdges(json.data ?? json);
      }
    } catch {
      notify(t('page.aas.pipeline.edgeStatus') + ' 조회 실패', { type: 'error' });
    }
  };

  const fetchPendings = async (page = pendingPage) => {
    try {
      const res = await authFetch(`${API}/pending?page=${page}&size=20`);
      if (res.ok) {
        const json = await res.json();
        const paged: PagedResponse<PendingItem> = json.data ?? json;
        setPendings(paged.content);
        setTotalPending(paged.totalElements);
      }
    } catch {
      notify(t('page.aas.pipeline.pendingManagement') + ' 조회 실패', { type: 'error' });
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchEdges();
    fetchPendings(0);

    statusTimerRef.current = setInterval(fetchStatus, 3000);
    slowTimerRef.current = setInterval(() => {
      fetchEdges();
      fetchPendings(pendingPage);
    }, 10000);

    return () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      if (slowTimerRef.current) clearInterval(slowTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPage]);

  const handleRetry = async (id: number) => {
    if (!perm.canUpdate) return;
    setRetryingId(id);
    try {
      const res = await authFetch(`${API}/pending/${id}/retry`, { method: 'POST' });
      const json = await res.json();
      const data = json.data ?? json;
      if (data.result === 'SUCCESS') {
        notify(t('page.aas.pipeline.retry') + ' 성공', { type: 'success' });
        fetchPendings();
      } else {
        notify(t('page.aas.pipeline.retry') + ' 실패: ' + data.message, { type: 'error' });
      }
    } catch {
      notify(t('page.aas.pipeline.retry') + ' 요청 실패', { type: 'error' });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteDead = async () => {
    if (!perm.canDelete) return;
    const ok = await confirm(t('page.aas.pipeline.confirmDeleteDead'));
    if (!ok) return;
    setDeletingDead(true);
    try {
      const res = await authFetch(`${API}/pending/dead`, { method: 'DELETE' });
      if (res.ok) {
        const json = await res.json();
        const data = json.data ?? json;
        notify(t('page.aas.pipeline.deleteAllDead') + ` (${data.deleted_count}건)`, { type: 'info' });
        fetchPendings(0);
        setPendingPage(0);
      }
    } catch {
      notify(t('page.aas.pipeline.deleteAllDead') + ' 실패', { type: 'error' });
    } finally {
      setDeletingDead(false);
    }
  };

  const statusBadge = (s: EdgeStatus['status']) => {
    const map = {
      NORMAL: { color: '#22c55e', label: t('page.aas.pipeline.status.normal') },
      DELAYED: { color: '#eab308', label: t('page.aas.pipeline.status.delayed') },
      NO_SIGNAL: { color: '#ef4444', label: t('page.aas.pipeline.status.noSignal') },
    };
    const { color, label } = map[s];
    return <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{label}</span>;
  };

  const connBadge = (s: PipelineStatus['redis_status'] | undefined) => {
    if (!s) return null;
    const map = {
      CONNECTED: { color: '#22c55e', label: t('page.aas.pipeline.status.connected') },
      DISCONNECTED: { color: '#ef4444', label: t('page.aas.pipeline.status.disconnected') },
      NOT_CONFIGURED: { color: '#9ca3af', label: t('page.aas.pipeline.status.notConfigured') },
    };
    const { color, label } = map[s];
    return <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{label}</span>;
  };

  const pendingBadge = (s: PendingItem['status']) => {
    const colorMap = { PENDING: '#3b82f6', DONE: '#22c55e', DEAD: '#ef4444' };
    return (
      <span style={{ background: colorMap[s], color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>
        {s}
      </span>
    );
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: 16,
  };
  const thStyle: React.CSSProperties = {
    background: 'var(--grid-header-bg, #f0f4f8)', borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--grid-font-size, 13px)', fontWeight: 600, textAlign: 'left', padding: '8px 10px',
    color: 'var(--color-text-primary)', whiteSpace: 'nowrap' as const,
  };
  const tdStyle: React.CSSProperties = {
    padding: '6px 10px', borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--grid-font-size, 13px)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' as const,
  };

  return (
    <div style={{ padding: 16 }}>
      <PageTitle menuCode={MENU_CODE} />

      {/* 영역 A: 파이프라인 토폴로지 */}
      <section style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
          {t('page.aas.pipeline.topology')}
        </h3>
        <PipelineTopologyChart status={status} />

        {/* KPI 4분할 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('page.aas.pipeline.insertTps')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {status?.insert_tps_5min.toFixed(2) ?? '-'}
            </div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Pending</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
              {status?.pending_count ?? '-'}
            </div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Done</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', marginTop: 4 }}>
              {status?.done_count ?? '-'}
            </div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Dead</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>
              {status?.dead_count ?? '-'}
            </div>
          </div>
        </div>

        {/* Redis / TimescaleDB 연결 상태 */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>
            Redis: {connBadge(status?.redis_status)}
          </span>
          <span style={{ fontSize: 13 }}>
            TimescaleDB: {connBadge(status?.timescaledb_status)}
          </span>
          {status && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              BQueue {status.queue_size.toLocaleString()} / {status.queue_capacity.toLocaleString()} ({status.queue_usage_percent.toFixed(1)}%)
            </span>
          )}
        </div>
      </section>

      {/* 영역 B: Edge 수신 현황 */}
      <section style={{ ...cardStyle, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
          {t('page.aas.pipeline.edgeStatus')}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t('page.aas.pipeline.col.edgeId')}</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.lastIngestAt')}</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.recentCount')}</th>
                <th style={thStyle}>상태</th>
              </tr>
            </thead>
            <tbody>
              {edges.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    수신 데이터 없음
                  </td>
                </tr>
              ) : edges.map(e => (
                <tr key={e.edge_id}>
                  <td style={tdStyle}>{e.edge_id}</td>
                  <td style={tdStyle}>{e.last_ingest_at ? new Date(e.last_ingest_at).toLocaleString() : '-'}</td>
                  <td style={tdStyle}>{e.recent_1min_count.toLocaleString()}</td>
                  <td style={tdStyle}>{statusBadge(e.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 영역 C: Pending/Dead 관리 */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {t('page.aas.pipeline.pendingManagement')}
          </h3>
          {perm.canDelete && (
            <button
              className="mes-btn mes-btn-delete"
              onClick={handleDeleteDead}
              disabled={deletingDead}
            >
              {t('page.aas.pipeline.deleteAllDead')}
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.retryCount')}</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.errorMessage')}</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.createdAt')}</th>
                <th style={thStyle}>{t('page.aas.pipeline.col.lastIngestAt')}</th>
                {perm.canUpdate && <th style={thStyle}>{t('page.aas.pipeline.retry')}</th>}
              </tr>
            </thead>
            <tbody>
              {pendings.length === 0 ? (
                <tr>
                  <td colSpan={perm.canUpdate ? 7 : 6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    없음
                  </td>
                </tr>
              ) : pendings.map(p => (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.id}</td>
                  <td style={tdStyle}>{pendingBadge(p.status)}</td>
                  <td style={tdStyle}>{p.retry_count}</td>
                  <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.error_message ?? '-'}
                  </td>
                  <td style={tdStyle}>{new Date(p.created_at).toLocaleString()}</td>
                  <td style={tdStyle}>{p.last_retry_at ? new Date(p.last_retry_at).toLocaleString() : '-'}</td>
                  {perm.canUpdate && (
                    <td style={tdStyle}>
                      {(p.status === 'PENDING' || p.status === 'DEAD') && p.retry_count < 10 ? (
                        <button
                          className="mes-btn"
                          onClick={() => handleRetry(p.id)}
                          disabled={retryingId === p.id}
                          style={{ fontSize: 12, padding: '2px 10px' }}
                        >
                          {t('page.aas.pipeline.retry')}
                        </button>
                      ) : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPending > 20 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              className="mes-btn"
              disabled={pendingPage === 0}
              onClick={() => setPendingPage(p => p - 1)}
            >
              이전
            </button>
            <span style={{ fontSize: 13, lineHeight: '30px' }}>
              {pendingPage + 1} / {Math.ceil(totalPending / 20)}
            </span>
            <button
              className="mes-btn"
              disabled={(pendingPage + 1) * 20 >= totalPending}
              onClick={() => setPendingPage(p => p + 1)}
            >
              다음
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
