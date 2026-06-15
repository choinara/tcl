import { useState, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { OPCUA_CATEGORIES, computeCategoryCounts } from '../../shared/constants';
import type { OpcuaCategory, AasTreeNode } from '../../shared/types';

// UI 템플릿용 고정 Mock 데이터 (백엔드 연결 없음)
const MOCK_DATA_POINTS = [
  { node_id: 'ns=2;s=LD-16A/Temperature/Zone1', browse_name: 'Zone1', korean_name: '존1 온도', category: 'Temperature', plc_address: '0x0010', data_type: 'Float', sampling_ms: 1000, unit: '℃', aas_linked: true,  aas_path: '/OperationalData/Temperature:Zone1', element_id: 1 },
  { node_id: 'ns=2;s=LD-16A/Temperature/Zone2', browse_name: 'Zone2', korean_name: '존2 온도', category: 'Temperature', plc_address: '0x0011', data_type: 'Float', sampling_ms: 1000, unit: '℃', aas_linked: true,  aas_path: '/OperationalData/Temperature:Zone2', element_id: 2 },
  { node_id: 'ns=2;s=LD-16A/Temperature/Zone3', browse_name: 'Zone3', korean_name: '존3 온도', category: 'Temperature', plc_address: '0x0012', data_type: 'Float', sampling_ms: 1000, unit: '℃', aas_linked: false, aas_path: null, element_id: null },
  { node_id: 'ns=2;s=LD-16A/Time/CycleTime',    browse_name: 'CycleTime',   korean_name: '사이클 타임',  category: 'Time',        plc_address: '0x0020', data_type: 'Int32', sampling_ms: 1000, unit: 'ms', aas_linked: true,  aas_path: '/OperationalData/Time:CycleTime',   element_id: 3 },
  { node_id: 'ns=2;s=LD-16A/Time/HeatTime',     browse_name: 'HeatTime',    korean_name: '가열 시간',    category: 'Time',        plc_address: '0x0021', data_type: 'Int32', sampling_ms: 1000, unit: 'ms', aas_linked: false, aas_path: null, element_id: null },
  { node_id: 'ns=2;s=LD-16A/Vision/OK',          browse_name: 'VisionOK',    korean_name: '비전 OK 수',  category: 'Vision',      plc_address: null,     data_type: 'Int32', sampling_ms: 1000, unit: 'ea', aas_linked: true,  aas_path: '/OperationalData/Vision:OK',        element_id: 4 },
  { node_id: 'ns=2;s=LD-16A/Vision/NG',          browse_name: 'VisionNG',    korean_name: '비전 NG 수',  category: 'Vision',      plc_address: null,     data_type: 'Int32', sampling_ms: 1000, unit: 'ea', aas_linked: false, aas_path: null, element_id: null },
  { node_id: 'ns=2;s=LD-16A/VisionNG/FilmOmit1', browse_name: 'FilmOmit1',   korean_name: '필름누락1',   category: 'VisionNG',    plc_address: null,     data_type: 'Int32', sampling_ms: 1000, unit: 'ea', aas_linked: false, aas_path: null, element_id: null },
  { node_id: 'ns=2;s=LD-16A/Pressure/Press1',    browse_name: 'Press1',      korean_name: '압력1',       category: 'Pressure',    plc_address: '0x0030', data_type: 'Float', sampling_ms: 1000, unit: 'kPa', aas_linked: true, aas_path: '/OperationalData/Pressure:Press1',  element_id: 5 },
];

interface LinkagePoint {
  node_id: string;
  browse_name: string;
  korean_name: string | null;
  category: string;
  plc_address: string | null;
  data_type: string | null;
  sampling_ms: number;
  unit: string | null;
  aas_linked: boolean;
  aas_path: string | null;
  element_id: number | null;
}

// ─── Mock AAS 트리 생성 ───
function buildAasTree(dataPoints: LinkagePoint[]): AasTreeNode {
  return {
    id: 'root',
    label: 'ProductionEquipment',
    type: 'root',
    children: [
      {
        id: 'sm-operational',
        label: 'OperationalData',
        type: 'submodel',
        children: OPCUA_CATEGORIES.map(cat => {
          const catPoints = dataPoints.filter(p => p.category === cat);
          return {
            id: `cat-${cat}`,
            label: cat,
            type: 'category' as const,
            children: catPoints.map(p => ({
              id: p.node_id,
              label: p.browse_name,
              type: 'element' as const,
              linked: p.aas_linked,
              dataPoint: {
                node_id: p.node_id,
                browse_name: p.browse_name,
                korean_name: p.korean_name || p.browse_name,
                category: p.category as OpcuaCategory,
                plc_address: p.plc_address || '',
                data_type: p.data_type || '',
                sampling_ms: p.sampling_ms,
                aas_path: p.aas_path,
                aas_linked: p.aas_linked,
                mock_value: 0,
                unit: p.unit || '',
              },
            })),
          };
        }),
      },
    ],
  };
}

// ─── Tree Component ───
function AasTreeView({
  node, depth = 0, selectedId, onSelect, expandedIds, onToggle,
}: {
  node: AasTreeNode; depth?: number; selectedId: string | null;
  onSelect: (node: AasTreeNode) => void;
  expandedIds: Set<string>; onToggle: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);

  const linkStats = useMemo(() => {
    if (node.type === 'element') return null;
    const elements = collectElements(node);
    const linked = elements.filter(e => e.linked).length;
    return { total: elements.length, linked };
  }, [node]);

  const iconColor = node.type === 'root' ? 'var(--color-primary)'
    : node.type === 'submodel' ? '#eab308'
    : node.type === 'category' ? '#a855f7'
    : node.linked ? '#22c55e' : '#eab308';

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={selectedId === node.id}>
      <button
        onClick={() => { if (hasChildren) onToggle(node.id); onSelect(node); }}
        aria-label={node.label}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', paddingLeft: `${depth * 16 + 8}px`,
          width: '100%', textAlign: 'left',
          fontSize: 13, border: 'none', cursor: 'pointer',
          borderRadius: '4px', color: 'var(--color-text)',
          background: selectedId === node.id ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
        }}
        onMouseEnter={e => { if (selectedId !== node.id) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-border) 50%, transparent)'; }}
        onMouseLeave={e => { if (selectedId !== node.id) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren
          ? <span style={{ fontSize: 10, flexShrink: 0 }}>{isExpanded ? '▼' : '▶'}</span>
          : <span style={{ width: '14px', flexShrink: 0 }} />
        }
        <span style={{ color: iconColor, flexShrink: 0 }}>{node.type === 'element' ? '◆' : '📁'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>
        {node.type === 'element' && (
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginLeft: 'auto',
            background: node.linked ? '#22c55e' : '#eab308',
          }} />
        )}
        {linkStats && linkStats.total > 0 && (
          <span role="status" aria-live="polite" style={{ color: 'var(--color-text-disabled)', fontSize: 12, marginLeft: 'auto', flexShrink: 0 }}>
            {linkStats.linked}/{linkStats.total}
          </span>
        )}
      </button>
      {isExpanded && <div role="group">{node.children?.map(child => (
        <AasTreeView
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggle={onToggle}
        />
      ))}</div>}
    </div>
  );
}

function collectElements(node: AasTreeNode): AasTreeNode[] {
  if (node.type === 'element') return [node];
  return node.children?.flatMap(c => collectElements(c)) ?? [];
}

// ─── Detail Panel ───
function LinkageDetail({ node, onUnlink, onLink, perm }: {
  node: AasTreeNode;
  onUnlink: (nodeId: string) => void;
  onLink: (nodeId: string) => void;
  perm: { canUpdate: boolean; canDelete: boolean };
}) {
  if (node.type !== 'element' || !node.dataPoint) {
    return (
      <div style={{ color: 'var(--color-text-disabled)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
        좌측 트리에서 Element를 선택하세요
      </div>
    );
  }

  const p = node.dataPoint;
  const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 600, marginBottom: '8px', color: 'var(--color-primary)' };
  const dlRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: '6px' };
  const dtStyle: React.CSSProperties = { color: 'var(--color-text-disabled)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontWeight: 700, fontSize: 13 }}>{p.korean_name}</h4>
        {p.aas_linked ? (
          perm.canDelete && <button className="mes-btn mes-btn-delete" aria-label={`${p.korean_name} AAS 연결 해제`} onClick={() => onUnlink(p.node_id)}>연결 해제</button>
        ) : (
          perm.canUpdate && <button className="mes-btn mes-btn-save" aria-label={`${p.korean_name} AAS 연결`} onClick={() => onLink(p.node_id)}>연결</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <h5 style={sectionTitle}>AAS Element</h5>
          <div style={dlRow}><span style={dtStyle}>ID Short</span><span>{p.browse_name}</span></div>
          <div style={dlRow}><span style={dtStyle}>카테고리</span><span>{p.category}</span></div>
          <div style={dlRow}>
            <span style={dtStyle}>연결 상태</span>
            <span style={{ color: p.aas_linked ? '#22c55e' : '#eab308', fontWeight: 600 }}>
              {p.aas_linked ? '연결됨' : '미연결'}
            </span>
          </div>
          {p.aas_path && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ ...dtStyle, fontSize: 12 }}>AAS Path</span>
              <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: '2px' }}>{p.aas_path}</div>
            </div>
          )}
        </div>
        <div>
          <h5 style={sectionTitle}>OPC-UA Mapping</h5>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ ...dtStyle, fontSize: 12 }}>Node ID</span>
            <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: '2px' }}>{p.node_id}</div>
          </div>
          <div style={dlRow}><span style={dtStyle}>PLC 주소</span><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.plc_address}</span></div>
          <div style={dlRow}><span style={dtStyle}>샘플링</span><span>{p.sampling_ms}ms</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───
export default function AasLinkagePage() {
  const perm = usePermission('AA0060');
  const [dataPoints, setDataPoints] = useState<LinkagePoint[]>(MOCK_DATA_POINTS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root', 'sm-operational']));
  const [filterCategory, setFilterCategory] = useState<OpcuaCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'linked' | 'unlinked'>('ALL');
  const [searchText, setSearchText] = useState('');

  const categoryCounts = useMemo(() => computeCategoryCounts(dataPoints), [dataPoints]);
  const aasTree = useMemo(() => buildAasTree(dataPoints), [dataPoints]);

  const linkageStats = useMemo(() => {
    const total = dataPoints.length;
    const linked = dataPoints.filter(p => p.aas_linked).length;
    return { total, linked, unlinked: total - linked, rate: total > 0 ? ((linked / total) * 100).toFixed(1) : '0' };
  }, [dataPoints]);

  const categoryStats = useMemo(() => {
    return OPCUA_CATEGORIES.map(cat => {
      const catPoints = dataPoints.filter(p => p.category === cat);
      const linked = catPoints.filter(p => p.aas_linked).length;
      return { cat, total: catPoints.length, linked, rate: catPoints.length > 0 ? ((linked / catPoints.length) * 100).toFixed(0) : '0' };
    });
  }, [dataPoints]);

  const filteredTableData = useMemo(() => {
    let result = dataPoints;
    if (filterCategory !== 'ALL') result = result.filter(p => p.category === filterCategory);
    if (filterStatus === 'linked') result = result.filter(p => p.aas_linked);
    else if (filterStatus === 'unlinked') result = result.filter(p => !p.aas_linked);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(p =>
        p.browse_name.toLowerCase().includes(q) ||
        (p.korean_name || '').toLowerCase().includes(q) ||
        (p.plc_address || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [dataPoints, filterCategory, filterStatus, searchText]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleSelectNode = (node: AasTreeNode) => {
    setSelectedNodeId(node.id);
    if (node.type === 'category') setFilterCategory(node.label as OpcuaCategory);
  };

  const selectedNode = useMemo(() => {
    function findNode(node: AasTreeNode, id: string): AasTreeNode | null {
      if (node.id === id) return node;
      for (const child of node.children ?? []) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    }
    return selectedNodeId ? findNode(aasTree, selectedNodeId) : null;
  }, [aasTree, selectedNodeId]);

  // 로컬 토글 (UI 템플릿 — 백엔드 연결 없음)
  const handleUnlink = (nodeId: string) => {
    setDataPoints(prev => prev.map(p => p.node_id === nodeId ? { ...p, aas_linked: false, aas_path: null, element_id: null } : p));
  };

  const handleLink = (nodeId: string) => {
    const point = dataPoints.find(p => p.node_id === nodeId);
    const aasPath = point ? `/OperationalData/${point.category}:${point.browse_name}` : '';
    setDataPoints(prev => prev.map(p => p.node_id === nodeId ? { ...p, aas_linked: true, aas_path: aasPath, element_id: 1 } : p));
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 13, boxSizing: 'border-box' as const,
    color: 'var(--color-text-primary)', background: 'var(--color-bg-primary)',
  };

  const thStyle: React.CSSProperties = {
    background: 'var(--grid-header-bg, #f0f4f8)', borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--grid-font-size, 13px)', fontWeight: 600, textAlign: 'left', padding: '8px 10px',
    color: 'var(--color-text-primary)', whiteSpace: 'nowrap' as const,
    position: 'sticky' as const, top: 0, zIndex: 10,
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: 16,
  };

  return (
    <div role="main" aria-label="AAS 트리 UI 템플릿" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PageTitle menuCode="AA0060" />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 연결 현황 */}
        <div role="status" aria-live="polite" aria-label="연결 현황 통계" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{linkageStats.total}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>전체</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{linkageStats.linked}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>연결</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#eab308' }}>{linkageStats.unlinked}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>미연결</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-text-disabled)' }}>연결률</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>{linkageStats.rate}%</span>
            </div>
            <div style={{ height: '12px', background: 'var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${linkageStats.rate}%`, background: '#22c55e', borderRadius: '6px', transition: 'width 0.5s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {categoryStats.map(cs => (
              <div key={cs.cat} style={{ background: 'var(--color-border)', borderRadius: '4px', padding: '8px 10px', textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: '4px' }}>{cs.cat}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{cs.linked}/{cs.total}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>{cs.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 메인 영역: 트리 + 테이블 */}
        <div style={{ display: 'flex', gap: '12px', minHeight: '450px' }}>
          <div role="region" aria-label="AAS 구조 트리" style={{ ...cardStyle, width: '33.3%', overflow: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: 13 }}>AAS 구조 트리</h3>
            <div role="tree" aria-label="AAS 구조">
              <AasTreeView
                node={aasTree}
                selectedId={selectedNodeId}
                onSelect={handleSelectNode}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
              />
            </div>
          </div>

          <div role="region" aria-label="연결 현황 목록" style={{ ...cardStyle, width: '66.7%', display: 'flex', flexDirection: 'column' }}>
            <div role="navigation" aria-label="카테고리 필터" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 700, fontSize: 13 }}>연결 현황</h3>
              <DropdownFilter
                options={OPCUA_CATEGORIES.map(c => ({ value: c, label: `${c} (${categoryCounts[c] || 0})` }))}
                value={filterCategory === 'ALL' ? '' : filterCategory}
                onChange={v => setFilterCategory((v || 'ALL') as OpcuaCategory | 'ALL')}
                allLabel="전체 카테고리"
                width={160}
              />
              <DropdownFilter
                options={[
                  { value: 'linked', label: '연결됨' },
                  { value: 'unlinked', label: '미연결' },
                ]}
                value={filterStatus === 'ALL' ? '' : filterStatus}
                onChange={v => setFilterStatus((v || 'ALL') as 'ALL' | 'linked' | 'unlinked')}
                allLabel="전체 상태"
                width={110}
              />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="검색..."
                aria-label="데이터 포인트 검색"
                style={{ ...selectStyle, flex: 1, minWidth: '150px' }}
              />
              <span role="status" aria-live="polite" style={{ fontSize: 13, color: 'var(--color-text-disabled)' }}>{filteredTableData.length}건</span>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              <table aria-label="AAS 연계 데이터 포인트 목록" style={{ width: '100%', fontSize: 'var(--grid-font-size)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th scope="col" style={thStyle}>AAS Element</th>
                    <th scope="col" style={thStyle}>카테고리</th>
                    <th scope="col" style={thStyle}>OPC-UA Node</th>
                    <th scope="col" style={thStyle}>PLC 주소</th>
                    <th scope="col" style={{ ...thStyle, textAlign: 'center' }}>연결</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.map(p => (
                    <tr
                      key={p.node_id}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border)',
                        background: selectedNodeId === p.node_id
                          ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                          : !p.aas_linked ? 'color-mix(in srgb, #eab308 5%, transparent)' : undefined,
                      }}
                      onClick={() => setSelectedNodeId(p.node_id)}
                      onMouseEnter={e => { if (selectedNodeId !== p.node_id) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-border) 50%, transparent)'; }}
                      onMouseLeave={e => { if (selectedNodeId !== p.node_id) e.currentTarget.style.background = !p.aas_linked ? 'color-mix(in srgb, #eab308 5%, transparent)' : ''; }}
                    >
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ fontSize: 12 }}>{p.browse_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{p.korean_name || ''}</div>
                      </td>
                      <td style={{ padding: '6px 10px', fontSize: 12 }}>{p.category}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 10, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.node_id}>
                        {p.node_id}
                      </td>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 12 }}>{p.plc_address || '-'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                          background: p.aas_linked ? '#22c55e' : '#eab308',
                        }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 하단 상세 패널 */}
        {selectedNode && (
          <div role="region" aria-label="선택된 항목 상세 정보" style={cardStyle}>
            <LinkageDetail node={selectedNode} onUnlink={handleUnlink} onLink={handleLink} perm={perm} />
          </div>
        )}
      </div>
    </div>
  );
}
