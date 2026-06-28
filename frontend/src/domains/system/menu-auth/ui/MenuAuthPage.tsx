import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TreeCheckboxMatrix, type TreeMatrixNode } from '@/components/ui/TreeCheckboxMatrix';
import { authFetch } from '@/lib/api';
import type { ApiResponse } from '@/components/grid/types';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/useToast';

interface Menu {
  id: number;
  menuCode: string;
  menuName: string;
  parentId: number | null;
  sortOrder: number;
  children?: Menu[];
}

interface MenuPermission {
  menuId: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewPii: boolean;
}

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description: string;
}

const permissionKeysDef = [
  { key: 'canRead', label: '조회' },
  { key: 'canCreate', label: '등록' },
  { key: 'canUpdate', label: '수정' },
  { key: 'canDelete', label: '삭제' },
  { key: 'canExport', label: '엑셀' },
  { key: 'canViewPii', label: 'PII' },
];

function flattenMenuTree(tree: Menu[]): Menu[] {
  const result: Menu[] = [];
  function traverse(nodes: Menu[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  }
  traverse(tree);
  return result;
}

function buildTreeMatrixNodes(
  menus: Menu[],
  permMap: Map<number, MenuPermission>
): TreeMatrixNode[] {
  const menuMap = new Map<number, Menu>();
  menus.forEach(m => menuMap.set(m.id, m));

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

  menus.forEach(m => {
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
        canViewPii: perm?.canViewPii ?? false,
      },
      children: children.map(c => buildNode(c)),
    };
  }

  return roots.map(r => buildNode(r));
}

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

export default function MenuAuthPage() {
  const perm = usePermission('SM0020');
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState<number | ''>('');
  const [treeNodes, setTreeNodes] = useState<TreeMatrixNode[]>([]);
  const [saving, setSaving] = useState(false);

  const permissionKeys = useMemo(() =>
    permissionKeysDef.map(p => ({ key: p.key, label: p.label })),
    []
  );

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const res = await authFetch('/api/system/roles');
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json = await res.json();
      const rolesData = json.data;
      return Array.isArray(rolesData) ? rolesData : rolesData?.content ?? [];
    },
    staleTime: 60_000,
  });

  const { data: menus } = useQuery<Menu[]>({
    queryKey: ['system-menus-list'],
    queryFn: async () => {
      const res = await authFetch('/api/system/menus/list');
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<Menu[]> = await res.json();
      return flattenMenuTree(json.data);
    },
    staleTime: 30_000,
  });

  const { data: permissions } = useQuery<MenuPermission[]>({
    queryKey: ['menu-auth', roleId],
    queryFn: async () => {
      if (!roleId) return [];
      const res = await authFetch(`/api/system/menu-auth/${roleId}`);
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<MenuPermission[]> = await res.json();
      return json.data;
    },
    enabled: roleId !== '',
    staleTime: 0,
  });

  const menuList = useMemo(() => menus ?? [], [menus]);

  useEffect(() => {
    if (!menuList.length) {
      setTreeNodes([]);
      return;
    }

    const permMap = new Map<number, MenuPermission>();
    (permissions ?? []).forEach(p => permMap.set(p.menuId, p));

    setTreeNodes(buildTreeMatrixNodes(menuList, permMap));
  }, [menuList, permissions]);

  const handleChange = useCallback((nodeId: number | string, permKey: string, checked: boolean) => {
    setTreeNodes(prev => updateNodeInTree(prev, nodeId, permKey, checked));
  }, []);

  const handleCascade = useCallback((nodeId: number | string, permKey: string, checked: boolean) => {
    setTreeNodes(prev => cascadePermInTree(prev, nodeId, permKey, checked));
  }, []);

  const handleToggleAll = useCallback((nodeId: number | string, checked: boolean) => {
    setTreeNodes(prev => toggleAllPermsInTree(prev, nodeId, checked));
  }, []);

  const handleSave = useCallback(async () => {
    if (!roleId) {
      notify('역할을 선택하세요.', { type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const allNodes = flattenTreeNodes(treeNodes);
      const payload = allNodes.map(node => ({
        menuId: node.id,
        canRead: node.permissions.canRead || false,
        canCreate: node.permissions.canCreate || false,
        canUpdate: node.permissions.canUpdate || false,
        canDelete: node.permissions.canDelete || false,
        canExport: node.permissions.canExport || false,
        canViewPii: node.permissions.canViewPii || false,
      }));

      const res = await authFetch(`/api/system/menu-auth/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');

      await queryClient.invalidateQueries({ queryKey: ['menu-auth', roleId] });
      notify('저장되었습니다', { type: 'success' });
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [roleId, treeNodes, queryClient, notify]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
        <div className="grid-toolbar">
          <PageTitle />
          {perm.canUpdate && (
            <button
              onClick={handleSave}
              disabled={saving || roleId === ''}
              className="mes-btn mes-btn-save"
              style={{ opacity: saving || roleId === '' ? 0.5 : 1 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>역할 선택</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
            style={{
              padding: '6px 10px', border: '1px solid #d1d5db',
              borderRadius: 4, fontSize: 14, minWidth: 200,
            }}
          >
            <option value="">-- 역할을 선택하세요 --</option>
            {(roles ?? []).map(role => (
              <option key={role.id} value={role.id}>{role.roleCode} ({role.roleName})</option>
            ))}
          </select>
        </div>
      </div>

      {roleId !== '' && (
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
      )}
    </div>
  );
}

function updateNodeInTree(
  nodes: TreeMatrixNode[],
  nodeId: number | string,
  permKey: string,
  checked: boolean
): TreeMatrixNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, permissions: { ...node.permissions, [permKey]: checked } };
    }
    if (node.children?.length) {
      return { ...node, children: updateNodeInTree(node.children, nodeId, permKey, checked) };
    }
    return node;
  });
}

function cascadePermInTree(
  nodes: TreeMatrixNode[],
  nodeId: number | string,
  permKey: string,
  checked: boolean
): TreeMatrixNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return cascadeChildrenPerm(node, permKey, checked);
    }
    if (node.children?.length) {
      return { ...node, children: cascadePermInTree(node.children, nodeId, permKey, checked) };
    }
    return node;
  });
}

function cascadeChildrenPerm(node: TreeMatrixNode, permKey: string, checked: boolean): TreeMatrixNode {
  let newPermissions: Record<string, boolean>;

  if (permKey === 'canRead' && !checked) {
    newPermissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false, canViewPii: false };
  } else {
    newPermissions = { ...node.permissions, [permKey]: checked };
  }

  return {
    ...node,
    permissions: newPermissions,
    children: node.children?.map(child => cascadeChildrenPerm(child, permKey, checked)),
  };
}

const ALL_PERMS = { canRead: true, canCreate: true, canUpdate: true, canDelete: true, canExport: true, canViewPii: true };
const NO_PERMS = { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false, canViewPii: false };

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
