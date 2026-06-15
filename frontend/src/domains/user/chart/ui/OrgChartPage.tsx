import { useState, useEffect, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface OrgChartNode {
  id: number;
  deptCode: string;
  deptName: string;
  deptLevel: number;
  managerName: string;
  phone: string;
  location: string;
  memberCount: number;
  children: OrgChartNode[];
}

function TreeNode({ node, depth = 0 }: { node: OrgChartNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: 4, marginBottom: 2,
          background: depth === 0 ? '#eff6ff' : depth === 1 ? '#f0fdf4' : '#fff',
          border: '1px solid #e5e7eb',
        }}
      >
        {hasChildren && <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span>}
        <span style={{ fontWeight: depth < 2 ? 600 : 400, fontSize: 14 }}>{node.deptName}</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>({node.deptCode})</span>
        <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>{`${node.memberCount}명`}</span>
        {node.managerName && (
          <span style={{ fontSize: 12, color: '#3b82f6', marginLeft: 'auto' }}>{node.managerName}</span>
        )}
      </div>
      {open && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChartPage() {
  const perm = usePermission('UM0050');
  const { notify } = useToast();
  const [treeData, setTreeData] = useState<OrgChartNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/organization/chart');
        if (res.ok) {
          const json = await res.json();
          setTreeData(json.data || []);
        }
      } catch { notify('조직도 조회에 실패했습니다', { type: 'error' }); } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: ColDef<OrgChartNode>[] = useMemo(() => [
    { field: 'deptCode', headerName: '부서코드', width: 120 },
    { field: 'deptName', headerName: '부서명', width: 150 },
    {
      field: 'deptLevel', headerName: '레벨', width: 100,
      valueFormatter: (p) => {
        const v = Number(p.value);
        return v === 1 ? 'L1 본부' : v === 2 ? 'L2 팀' : 'L3 파트';
      },
    },
    { field: 'managerName', headerName: '부서장', width: 100 },
    { field: 'phone', headerName: '전화', width: 130 },
    { field: 'location', headerName: '위치', width: 130 },
    { field: 'memberCount', headerName: '인원수', width: 80 },
  ], []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{'조직도'}</h2>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa', minHeight: 200 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>{'로딩 중...'}</div>
          ) : treeData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>{'조직도 데이터가 없습니다.'}</div>
          ) : (
            treeData.map(node => <TreeNode key={node.id} node={node} />)
          )}
        </div>
      </div>

      <PeakDataGrid<OrgChartNode>
        toolbarLeft={<h2>{'부서 목록'}</h2>}
        columns={columns}
        queryKey={['org-chart-flat']}
        queryUrl="/organization/chart/flat"
        permission={{ canExport: perm.canExport }}
      />
    </div>
  );
}
