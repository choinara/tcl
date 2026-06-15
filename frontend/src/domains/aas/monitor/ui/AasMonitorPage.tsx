import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { OPCUA_CATEGORIES, computeCategoryCounts } from '../../shared/constants';
import { authFetch } from '@/lib/api';
import type { CollectionChannel, CollectionStatus, CollectedRow, OpcuaCategory } from '../../shared/types';

const API_BASE = '';

export default function AasMonitorPage() {
  const perm = usePermission('AA0080');
  const { notify } = useToast();
  const [channels, setChannels] = useState<CollectionChannel[]>([]);
  const [statuses, setStatuses] = useState<CollectionStatus[]>([]);
  const [collectedRows, setCollectedRows] = useState<CollectedRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<OpcuaCategory | 'ALL'>('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [chRes, stRes, drRes] = await Promise.all([
        authFetch(`${API_BASE}/api/opcua/channels`),
        authFetch(`${API_BASE}/api/opcua/collection-status`),
        authFetch(`${API_BASE}/api/opcua/collected-data`),
      ]);
      if (chRes.ok) setChannels(await chRes.json());
      if (stRes.ok) setStatuses(await stRes.json());
      if (drRes.ok) setCollectedRows(await drRes.json());
    } catch (e) {
      console.error('데이터 로드 실패:', e);
      notify('데이터 로드 실패', { type: 'error' });
    }
  }, [notify]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const categoryCounts = useMemo(() => computeCategoryCounts(statuses), [statuses]);

  const filteredRows = useMemo(() => {
    if (categoryFilter === 'ALL') return collectedRows;
    return collectedRows.filter(r => r.category === categoryFilter);
  }, [categoryFilter, collectedRows]);

  const toggleChannel = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`${API_BASE}/api/opcua/channels/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setChannels(prev => prev.map(ch => ch.channel_id === id ? updated : ch));
        notify(updated.active ? `${updated.name} 수집 시작` : `${updated.name} 수집 중지`, { type: updated.active ? 'success' : 'warning' });
      }
    } catch { notify('채널 토글 실패', { type: 'error' }); }
  }, [notify]);

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
    <div role="main" aria-label="수집 모니터링" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageTitle />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Channel cards + Category stats */}
        <div role="region" aria-label="채널 및 카테고리 통계" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {channels.map(ch => (
            <div key={ch.channel_id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 700 }}>{ch.name}</h3>
                <span role="status" aria-live="polite" style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 600,
                  color: '#fff', background: ch.active ? '#22c55e' : '#9ca3af',
                }}>
                  {ch.active ? '활성' : '비활성'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 13, marginBottom: '12px' }}>
                <div><span style={{ color: 'var(--color-text-disabled)' }}>수집 건수:</span> {ch.collected_count}</div>
                <div><span style={{ color: 'var(--color-text-disabled)' }}>마지막 수집:</span> {ch.last_collected || '-'}</div>
              </div>
              {perm.canUpdate && (
                <button
                  className={ch.active ? 'mes-btn mes-btn-delete' : 'mes-btn mes-btn-save'}
                  style={{ width: '100%' }}
                  onClick={() => toggleChannel(ch.channel_id)}
                  aria-label={`${ch.name} 수집 ${ch.active ? '중지' : '시작'}`}
                >
                  {ch.active ? '중지' : '시작'}
                </button>
              )}
            </div>
          ))}

          {/* 카테고리별 통계 카드 */}
          <div role="region" aria-label="카테고리별 노드 수 통계" style={cardStyle}>
            <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>카테고리별 노드 수</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 13 }}>
              {OPCUA_CATEGORIES.map(cat => (
                <div key={cat} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                  background: 'var(--color-border)', borderRadius: '4px',
                }}>
                  <span>{cat}</span><span style={{ fontWeight: 600 }}>{categoryCounts[cat] || 0}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                background: 'color-mix(in srgb, var(--color-border) 150%, transparent)', borderRadius: '4px', fontWeight: 600,
              }}>
                <span>합계</span><span>{Object.values(categoryCounts).reduce((a, b) => a + b, 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 자산별 수집 상태 */}
        <div role="region" aria-label="자산별 수집 상태" style={cardStyle}>
          <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>자산별 수집 상태</h3>
          <table aria-label="자산별 수집 상태 테이블" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>자산명</th>
                <th scope="col" style={thStyle}>연결</th>
                <th scope="col" style={thStyle}>마지막 수집</th>
                <th scope="col" style={thStyle}>에러 수</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.instance_id}>
                  <td style={tdStyle}>{s.instance_name}</td>
                  <td style={tdStyle}>
                    <span role="status" aria-live="polite" style={{ color: s.connected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {s.connected ? '연결됨' : '끊김'}
                    </span>
                  </td>
                  <td style={tdStyle}>{s.last_collected || '-'}</td>
                  <td style={tdStyle}>
                    {s.error_count > 0 ? <span style={{ color: '#ef4444' }}>{s.error_count}</span> : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 최근 수집 데이터 */}
        <div role="region" aria-label="최근 수집 데이터" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 700 }}>최근 수집 데이터</h3>
            <DropdownFilter
              options={OPCUA_CATEGORIES.map(c => ({ value: c, label: `${c} (${categoryCounts[c] || 0})` }))}
              value={categoryFilter === 'ALL' ? '' : categoryFilter}
              onChange={v => setCategoryFilter((v || 'ALL') as OpcuaCategory | 'ALL')}
              allLabel="전체 카테고리"
              width={160}
            />
          </div>
          <table aria-label="최근 수집 데이터 테이블" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>Timestamp</th>
                <th scope="col" style={thStyle}>Node ID</th>
                <th scope="col" style={thStyle}>AAS Path</th>
                <th scope="col" style={thStyle}>PLC Address</th>
                <th scope="col" style={thStyle}>Category</th>
                <th scope="col" style={thStyle}>Value</th>
                <th scope="col" style={thStyle}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-disabled)' }}>수집된 데이터가 없습니다</td></tr>
              ) : filteredRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{r.timestamp}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.node_id}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.aas_path || <span style={{ color: 'var(--color-text-disabled)' }}>미연결</span>}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{r.plc_address}</td>
                  <td style={tdStyle}>{r.category}</td>
                  <td style={tdStyle}>{r.value}</td>
                  <td style={tdStyle}>{r.unit || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
