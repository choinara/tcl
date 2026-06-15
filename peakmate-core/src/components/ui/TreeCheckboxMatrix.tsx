import { useState, useCallback } from 'react';

interface TreeMatrixNode {
  id: number | string;
  label: string;
  depth: number;
  permissions: Record<string, boolean>;
  children?: TreeMatrixNode[];
}

interface TreeCheckboxMatrixProps {
  nodes: TreeMatrixNode[];
  permissionKeys: { key: string; label: string }[];
  onChange: (nodeId: number | string, permKey: string, checked: boolean) => void;
  onCascade?: (nodeId: number | string, permKey: string, checked: boolean) => void;
  onToggleAll?: (nodeId: number | string, checked: boolean) => void;
  allLabel?: string;
  readOnly?: boolean;
}

function TreeMatrixRow({
  node,
  permissionKeys,
  onChange,
  onCascade,
  onToggleAll,
  readOnly,
  expandedMap,
  toggleExpand,
}: {
  node: TreeMatrixNode;
  permissionKeys: { key: string; label: string }[];
  onChange: (nodeId: number | string, permKey: string, checked: boolean) => void;
  onCascade?: (nodeId: number | string, permKey: string, checked: boolean) => void;
  onToggleAll?: (nodeId: number | string, checked: boolean) => void;
  readOnly?: boolean;
  expandedMap: Record<string, boolean>;
  toggleExpand: (nodeId: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedMap[String(node.id)] !== false; // default expanded
  const allChecked = permissionKeys.every(pk => node.permissions[pk.key]);

  return (
    <>
      <tr>
        <td style={{ paddingLeft: node.depth * 20 + 8, fontWeight: node.depth === 0 ? 600 : 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {hasChildren ? (
              <span
                onClick={() => toggleExpand(String(node.id))}
                style={{ cursor: 'pointer', fontSize: 'var(--font-size-sm)', width: 16, textAlign: 'center', userSelect: 'none' }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            ) : (
              <span style={{ width: 16 }} />
            )}
            <span>{node.label}</span>
          </div>
        </td>
        {onToggleAll && (
          <td style={{ textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => onToggleAll(node.id, e.target.checked)}
              disabled={readOnly}
            />
          </td>
        )}
        {permissionKeys.map(pk => (
          <td key={pk.key} style={{ textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={node.permissions[pk.key] || false}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange(node.id, pk.key, checked);
                // 자식이 있는 카테고리 메뉴: 모든 권한 체크 시 하위 일괄 cascade
                if (hasChildren && onCascade) {
                  onCascade(node.id, pk.key, checked);
                }
              }}
              disabled={readOnly}
            />
          </td>
        ))}
      </tr>
      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeMatrixRow
          key={child.id}
          node={child}
          permissionKeys={permissionKeys}
          onChange={onChange}
          onCascade={onCascade}
          onToggleAll={onToggleAll}
          readOnly={readOnly}
          expandedMap={expandedMap}
          toggleExpand={toggleExpand}
        />
      ))}
    </>
  );
}

export function TreeCheckboxMatrix({
  nodes,
  permissionKeys,
  onChange,
  onCascade,
  onToggleAll,
  allLabel = '전체',
  readOnly = false,
}: TreeCheckboxMatrixProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedMap(prev => ({
      ...prev,
      [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId],
    }));
  }, []);

  const totalCols = permissionKeys.length + 1 + (onToggleAll ? 1 : 0);

  return (
    <table className="mes-grid" style={{ width: '100%' }}>
      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9' }}>
        <tr>
          <th style={{ width: 280 }}>메뉴</th>
          {onToggleAll && (
            <th style={{ width: 60, textAlign: 'center' }}>{allLabel}</th>
          )}
          {permissionKeys.map(pk => (
            <th key={pk.key} style={{ width: 80, textAlign: 'center' }}>{pk.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {nodes.length === 0 ? (
          <tr>
            <td colSpan={totalCols} className="loading">데이터가 없습니다</td>
          </tr>
        ) : (
          nodes.map(node => (
            <TreeMatrixRow
              key={node.id}
              node={node}
              permissionKeys={permissionKeys}
              onChange={onChange}
              onCascade={onCascade}
              onToggleAll={onToggleAll}
              readOnly={readOnly}
              expandedMap={expandedMap}
              toggleExpand={toggleExpand}
            />
          ))
        )}
      </tbody>
    </table>
  );
}

export type { TreeMatrixNode };
