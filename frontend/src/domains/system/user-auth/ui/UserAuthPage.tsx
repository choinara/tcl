import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TreeCheckboxMatrix, type TreeMatrixNode } from '@/components/ui/TreeCheckboxMatrix';
import { SplitPanel } from '@/components/ui/SplitPanel';
import { authFetch } from '@/lib/api';
import type { ApiResponse } from '@/components/grid/types';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface UserItem {
  id: number;
  username: string;
  name: string;
  roles: string[];
  enabled: boolean;
}

interface Menu {
  id: number;
  menuCode: string;
  menuName: string;
  parentId: number | null;
  sortOrder: number;
  children?: Menu[];
}

interface UserPermission {
  menuId: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const permissionKeysDef = [
  { key: 'canRead', label: '조회' },
  { key: 'canCreate', label: '등록' },
  { key: 'canUpdate', label: '수정' },
  { key: 'canDelete', label: '삭제' },
  { key: 'canExport', label: '엑셀' },
];

/** 트리 형태 API 응답을 flat list로 변환 */
function flattenMenuTree(tree: Menu[]): Menu[] {
  const result: Menu[] = [];
  function traverse(nodes: Menu[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) traverse(node.children);
    }
  }
  traverse(tree);
  return result;
}

/** flat menu list를 TreeMatrixNode 트리로 변환 */
function buildTreeMatrixNodes(
  menus: Menu[],
  permMap: Map<number, UserPermission>,
): TreeMatrixNode[] {
  const menuMap = new Map<number, Menu>();
  menus.forEach((m) => menuMap.set(m.id, m));

  function getDepth(menu: Menu): number {
    let depth = 0;
    let current = menu;
    while (current.parentId && menuMap.has(current.parentId)) {
      depth++;
      current = menuMap.get(current.parentId)!;
    }
    return depth;
  }

  const childrenMap = new Map<number | null, Menu[]>();
  const roots: Menu[] = [];

  menus.forEach((m) => {
    if (m.parentId === null || m.parentId === undefined) {
      roots.push(m);
    } else {
      const children = childrenMap.get(m.parentId) ?? [];
      children.push(m);
      childrenMap.set(m.parentId, children);
    }
  });

  function buildNode(menu: Menu): TreeMatrixNode {
    const perm = permMap.get(menu.id);
    const children = childrenMap.get(menu.id) ?? [];
    return {
      id: menu.id,
      label: menu.menuName,
      depth: getDepth(menu),
      permissions: {
        canRead: perm?.canRead ?? false,
        canCreate: perm?.canCreate ?? false,
        canUpdate: perm?.canUpdate ?? false,
        canDelete: perm?.canDelete ?? false,
        canExport: perm?.canExport ?? false,
      },
      children: children.map((c) => buildNode(c)),
    };
  }

  return roots.map((r) => buildNode(r));
}

/** 전체 트리를 flat으로 순회하여 노드 수집 */
function flattenTreeNodes(nodes: TreeMatrixNode[]): TreeMatrixNode[] {
  const result: TreeMatrixNode[] = [];
  function traverse(ns: TreeMatrixNode[]) {
    for (const n of ns) {
      result.push(n);
      if (n.children?.length) traverse(n.children);
    }
  }
  traverse(nodes);
  return result;
}

export default function UserAuthPage() {
  const perm = usePermission('SM0050');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userKeyword, setUserKeyword] = useState('');
  const [treeNodes, setTreeNodes] = useState<TreeMatrixNode[]>([]);
  const [saving, setSaving] = useState(false);

  const permissionKeys = useMemo(() =>
    permissionKeysDef.map(p => ({ key: p.key, label: p.label })),
    []
  );

  // 사용자 목록 조회
  const { data: usersData, isLoading: usersLoading } = useQuery<UserItem[]>({
    queryKey: ['system-users-list', userKeyword],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '0', size: '200', sort: 'name', direction: 'ASC' });
      if (userKeyword.trim()) params.set('keyword', userKeyword.trim());
      const res = await authFetch(`/api/system/users?${params}`);
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<{ content: UserItem[] }> = await res.json();
      return json.data.content;
    },
    staleTime: 30_000,
  });

  // 메뉴 목록
  const { data: menus } = useQuery<Menu[]>({
    queryKey: ['system-menus-list'],
    queryFn: async () => {
      const res = await authFetch('/api/system/menus');
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<Menu[]> = await res.json();
      return flattenMenuTree(json.data);
    },
    staleTime: 30_000,
  });

  // 선택된 사용자의 예외권한 조회
  const { data: permissions } = useQuery<UserPermission[]>({
    queryKey: ['user-auth', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const res = await authFetch(`/api/system/user-auth/${selectedUserId}`);
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<UserPermission[]> = await res.json();
      return json.data;
    },
    enabled: selectedUserId !== null,
    staleTime: 0,
  });

  const menuList = useMemo(() => menus ?? [], [menus]);
  const users = useMemo(() => usersData ?? [], [usersData]);
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId],
  );

  // 트리 노드 빌드
  useEffect(() => {
    if (!menuList.length || selectedUserId === null) {
      setTreeNodes([]);
      return;
    }
    const permMap = new Map<number, UserPermission>();
    (permissions ?? []).forEach((p) => permMap.set(p.menuId, p));
    setTreeNodes(buildTreeMatrixNodes(menuList, permMap));
  }, [menuList, permissions, selectedUserId]);

  const handleChange = useCallback(
    (nodeId: number | string, permKey: string, checked: boolean) => {
      setTreeNodes((prev) => updateNodeInTree(prev, nodeId, permKey, checked));
    },
    [],
  );

  const handleCascade = useCallback(
    (nodeId: number | string, permKey: string, checked: boolean) => {
      setTreeNodes((prev) => cascadePermInTree(prev, nodeId, permKey, checked));
    },
    [],
  );

  const handleToggleAll = useCallback(
    (nodeId: number | string, checked: boolean) => {
      setTreeNodes((prev) => toggleAllPermsInTree(prev, nodeId, checked));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (selectedUserId === null) return;
    setSaving(true);
    try {
      const allNodes = flattenTreeNodes(treeNodes);
      const payload = allNodes.map((node) => ({
        menuId: node.id,
        canRead: node.permissions.canRead || false,
        canCreate: node.permissions.canCreate || false,
        canUpdate: node.permissions.canUpdate || false,
        canDelete: node.permissions.canDelete || false,
        canExport: node.permissions.canExport || false,
      }));

      const res = await authFetch(`/api/system/user-auth/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      await queryClient.invalidateQueries({ queryKey: ['user-auth', selectedUserId] });
      notify('저장되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [selectedUserId, treeNodes, queryClient]);

  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: 8 }}>
        <input
          placeholder="사용자 검색 (이름, ID)"
          value={userKeyword}
          onChange={(e) => setUserKeyword(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 13,
          }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <table className="mes-grid" style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>이름</th>
              <th style={{ width: 100 }}>ID</th>
              <th style={{ width: 100 }}>역할</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr><td colSpan={3} className="loading">로딩 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={3} className="loading">사용자가 없습니다</td></tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  style={{
                    cursor: 'pointer',
                    background: user.id === selectedUserId ? '#eff6ff' : undefined,
                  }}
                >
                  <td style={{ fontWeight: user.id === selectedUserId ? 600 : 400 }}>
                    {user.name}
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{user.username}</td>
                  <td style={{ fontSize: 12 }}>
                    {user.roles?.map((r) => r.replace('ROLE_', '')).join(', ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, paddingBottom: 8, borderBottom: '1px solid #e5e7eb', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
            {selectedUser
              ? `${selectedUser.name} (${selectedUser.username}) 예외권한`
              : '좌측에서 사용자를 선택하세요'}
          </div>
          {selectedUser && perm.canUpdate && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mes-btn mes-btn-save"
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
        {selectedUser && (
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
            체크된 권한만 예외로 적용됩니다. 체크하지 않은 메뉴는 역할 기본권한을 따릅니다.
          </p>
        )}
      </div>

      {selectedUser ? (
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <TreeCheckboxMatrix
            nodes={treeNodes}
            permissionKeys={permissionKeys}
            onChange={handleChange}
            onCascade={handleCascade}
            onToggleAll={handleToggleAll}
            allLabel="전체"
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          사용자를 선택하면 예외권한을 설정할 수 있습니다
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar" style={{ flexShrink: 0 }}>
        <PageTitle />
      </div>
      <SplitPanel left={leftPanel} right={rightPanel} leftWidth="30%" />
    </div>
  );
}

/** 트리에서 특정 노드의 권한을 업데이트 */
function updateNodeInTree(
  nodes: TreeMatrixNode[],
  nodeId: number | string,
  permKey: string,
  checked: boolean,
): TreeMatrixNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, permissions: { ...node.permissions, [permKey]: checked } };
    }
    if (node.children?.length) {
      return { ...node, children: updateNodeInTree(node.children, nodeId, permKey, checked) };
    }
    return node;
  });
}

/** 특정 노드의 하위 전체에 지정 퍼미션을 cascade 적용 */
function cascadePermInTree(
  nodes: TreeMatrixNode[],
  nodeId: number | string,
  permKey: string,
  checked: boolean,
): TreeMatrixNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return cascadeChildrenPerm(node, permKey, checked);
    }
    if (node.children?.length) {
      return { ...node, children: cascadePermInTree(node.children, nodeId, permKey, checked) };
    }
    return node;
  });
}

/** 하위 전체에 퍼미션 적용. canRead 해제 시 모든 권한 해제 */
function cascadeChildrenPerm(
  node: TreeMatrixNode,
  permKey: string,
  checked: boolean,
): TreeMatrixNode {
  let newPermissions: Record<string, boolean>;

  if (permKey === 'canRead' && !checked) {
    newPermissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };
  } else {
    newPermissions = { ...node.permissions, [permKey]: checked };
  }

  return {
    ...node,
    permissions: newPermissions,
    children: node.children?.map((child) => cascadeChildrenPerm(child, permKey, checked)),
  };
}

const ALL_PERMS = { canRead: true, canCreate: true, canUpdate: true, canDelete: true, canExport: true };
const NO_PERMS = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };

/** 특정 노드의 모든 권한을 일괄 체크/해제. 자식이 있으면 하위 전체 cascade */
function toggleAllPermsInTree(
  nodes: TreeMatrixNode[],
  nodeId: number | string,
  checked: boolean,
): TreeMatrixNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return setAllPerms(node, checked);
    }
    if (node.children?.length) {
      return { ...node, children: toggleAllPermsInTree(node.children, nodeId, checked) };
    }
    return node;
  });
}

function setAllPerms(node: TreeMatrixNode, checked: boolean): TreeMatrixNode {
  return {
    ...node,
    permissions: checked ? { ...ALL_PERMS } : { ...NO_PERMS },
    children: node.children?.map((child) => setAllPerms(child, checked)),
  };
}
