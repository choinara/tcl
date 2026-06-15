import { useState, useEffect, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { OPCUA_CATEGORIES } from '../../shared/constants';
import { authFetch } from '@/lib/api';
import type { GatewaySession, GatewayLog, GatewayEquipNode } from '../../shared/types';

const API_BASE = '';

interface GatewayStatus {
  endpoint: string;
  namespace_uri: string;
  security_policy: string;
  status: string;
  uptime: string;
  total_sessions: number;
  total_subscriptions: number;
  total_monitored_items: number;
  cpu_usage: number;
  memory_mb: number;
}

export default function AasGatewayPage() {
  const perm = usePermission('AA0070');
  const { notify } = useToast();
  const [serverStatus, setServerStatus] = useState<GatewayStatus | null>(null);
  const [sessions, setSessions] = useState<GatewaySession[]>([]);
  const [equipNodes, setEquipNodes] = useState<GatewayEquipNode[]>([]);
  const [logs, setLogs] = useState<GatewayLog[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, sessRes, equipRes, logRes] = await Promise.all([
        authFetch(`${API_BASE}/api/opcua/gateway/status`),
        authFetch(`${API_BASE}/api/opcua/gateway/sessions`),
        authFetch(`${API_BASE}/api/opcua/gateway/equip-nodes`),
        authFetch(`${API_BASE}/api/opcua/gateway/logs`),
      ]);
      if (statusRes.ok) setServerStatus(await statusRes.json());
      if (sessRes.ok) setSessions(await sessRes.json());
      if (equipRes.ok) setEquipNodes(await equipRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (e) {
      console.error('게이트웨이 데이터 로드 실패:', e);
      notify('게이트웨이 데이터 로드 실패', { type: 'error' });
    }
  }, [notify]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredLogs = logFilter === 'ALL' ? logs : logs.filter(l => l.level === logFilter);

  const disconnectSession = async (id: string) => {
    try {
      const res = await authFetch(`${API_BASE}/api/opcua/gateway/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(p => p.filter(s => s.session_id !== id));
        notify('세션 종료 완료', { type: 'warning' });
      }
    } catch { notify('세션 종료 실패', { type: 'error' }); }
  };

  const clearLogs = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/opcua/gateway/logs`, { method: 'DELETE' });
      if (res.ok) { setLogs([]); notify('로그 삭제 완료', { type: 'info' }); }
    } catch { notify('로그 삭제 실패', { type: 'error' }); }
  };

  const levelColors: Record<string, string> = { INFO: 'var(--color-primary)', WARN: '#eab308', ERROR: '#ef4444' };

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

  const logFilterBtn = (f: typeof logFilter, label: string) => {
    const count = f === 'ALL' ? logs.length : logs.filter(l => l.level === f).length;
    return (
      <button
        key={f}
        onClick={() => setLogFilter(f)}
        className={logFilter === f ? 'mes-btn mes-btn-search' : 'mes-btn'}
        aria-label={`로그 레벨 필터: ${label}`}
        aria-pressed={logFilter === f}
      >
        {label} ({count})
      </button>
    );
  };

  return (
    <div role="main" aria-label="OPC-UA 게이트웨이" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageTitle />

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Section 1: 서버 상태 */}
        <div role="region" aria-label="서버 상태" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>서버 상태</h2>
            {perm.canUpdate && (
              <button className="mes-btn mes-btn-delete" aria-label="서버 재시작" onClick={() => notify('서버 재시작은 운영 환경에서만 가능합니다.', { type: 'warning' })}>
                서버 재시작
              </button>
            )}
          </div>
          {serverStatus ? (
            <>
              <div role="status" aria-live="polite" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'var(--color-border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: 8 }}>상태</div>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{serverStatus.status}</span>
                </div>
                <div style={{ background: 'var(--color-border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: 8 }}>가동 시간</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{serverStatus.uptime}</div>
                </div>
                <div style={{ background: 'var(--color-border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: 8 }}>연결 정보</div>
                  <div style={{ fontSize: 13 }}>
                    <div>세션: <span style={{ fontWeight: 600 }}>{serverStatus.total_sessions}</span></div>
                    <div>구독: <span style={{ fontWeight: 600 }}>{serverStatus.total_subscriptions}</span></div>
                    <div>모니터링: <span style={{ fontWeight: 600 }}>{serverStatus.total_monitored_items}</span></div>
                  </div>
                </div>
                <div style={{ background: 'var(--color-border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: 8 }}>리소스</div>
                  <div style={{ fontSize: 13 }}>
                    <div>CPU: {serverStatus.cpu_usage}%</div>
                    <div>RAM: {serverStatus.memory_mb} MB</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--color-text-disabled)' }}>Endpoint:</span> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{serverStatus.endpoint}</span></div>
                <div><span style={{ color: 'var(--color-text-disabled)' }}>Namespace:</span> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{serverStatus.namespace_uri}</span></div>
                <div><span style={{ color: 'var(--color-text-disabled)' }}>Security:</span> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{serverStatus.security_policy}</span></div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-disabled)', padding: 32 }}>서버 정보 로딩 중...</div>
          )}
        </div>

        {/* Section 2: 세션 관리 */}
        <div role="region" aria-label="세션 관리" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>
              세션 관리 <span style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{sessions.length}</span>
            </h2>
          </div>
          <table aria-label="세션 목록" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>Session ID</th>
                <th scope="col" style={thStyle}>클라이언트명</th>
                <th scope="col" style={thStyle}>IP</th>
                <th scope="col" style={thStyle}>연결 시각</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>구독</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>모니터링 항목</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-disabled)' }}>활성 세션이 없습니다</td></tr>
              ) : sessions.map(s => (
                <tr key={s.session_id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{s.session_id}</td>
                  <td style={tdStyle}>{s.client_name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{s.client_ip}</td>
                  <td style={tdStyle}>{s.connected_at}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{s.subscriptions}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{s.monitored_items}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {perm.canDelete && (
                      <button className="mes-btn mes-btn-delete" aria-label={`세션 ${s.session_id} 종료`} style={{ padding: '2px 8px' }}
                        onClick={() => disconnectSession(s.session_id)}>종료</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: 설비별 노드 현황 */}
        <div role="region" aria-label="설비별 노드 현황" style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>설비별 노드 현황</h2>
          <table aria-label="설비별 노드 목록" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>Instance ID</th>
                <th scope="col" style={thStyle}>설비명</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>노드 수</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>연결상태</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>Last Read</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>Last Write</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>Read</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>Write</th>
                <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {equipNodes.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-disabled)' }}>등록된 노드가 없습니다</td></tr>
              ) : equipNodes.map(eq => (
                <tr key={eq.instance_id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{eq.instance_id}</td>
                  <td style={tdStyle}>{eq.instance_name}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{eq.node_count}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ color: eq.connected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {eq.connected ? '연결됨' : '끊김'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{eq.last_read}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{eq.last_write}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{typeof eq.read_count === 'number' ? eq.read_count.toLocaleString() : eq.read_count}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{typeof eq.write_count === 'number' ? eq.write_count.toLocaleString() : eq.write_count}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {eq.error_count > 0 ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{eq.error_count}</span> : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: 카테고리 통계 */}
        <div role="region" aria-label="카테고리별 노드 현황" style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>카테고리별 노드 현황</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {OPCUA_CATEGORIES.map(cat => {
              const eq = equipNodes.find(e => e.instance_id === cat);
              return (
                <div key={cat} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
                  background: 'var(--color-border)', borderRadius: 4, fontSize: 13,
                }}>
                  <span>{cat}</span><span style={{ fontWeight: 600 }}>{eq?.node_count ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: 게이트웨이 로그 */}
        <div role="region" aria-label="게이트웨이 로그" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>게이트웨이 로그</h2>
            {perm.canDelete && (
              <button className="mes-btn mes-btn-delete" aria-label="로그 삭제" onClick={clearLogs} disabled={logs.length === 0}>
                로그 삭제
              </button>
            )}
          </div>
          <div role="group" aria-label="로그 레벨 필터" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {logFilterBtn('ALL', '전체')}
            {logFilterBtn('INFO', 'INFO')}
            {logFilterBtn('WARN', 'WARN')}
            {logFilterBtn('ERROR', 'ERROR')}
          </div>
          <table aria-label="게이트웨이 로그 목록" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={{ ...thStyle, width: '128px' }}>Timestamp</th>
                <th scope="col" style={{ ...thStyle, width: '80px' }}>Level</th>
                <th scope="col" style={{ ...thStyle, width: '144px' }}>Source</th>
                <th scope="col" style={thStyle}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-disabled)' }}>로그가 없습니다</td></tr>
              ) : filteredLogs.map(l => (
                <tr key={l.id}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{l.timestamp}</td>
                  <td style={tdStyle}>
                    <span style={{ color: levelColors[l.level] || 'var(--color-text)', fontWeight: 600, fontSize: 12 }}>{l.level}</span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{l.source}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
