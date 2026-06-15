import { useState, useRef, useCallback, type ReactNode, type DragEvent } from 'react';

export interface TreeNode {
  id: number | string;
  label: string;
  children?: TreeNode[];
  data?: Record<string, unknown>;
}

interface TreeViewProps {
  nodes: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  selectedId?: number | string;
  renderActions?: (node: TreeNode) => ReactNode;
  onReorder?: (nodeId: number | string, targetParentId: number | string | null, newIndex: number) => void;
  defaultExpanded?: boolean;
}

function TreeItem({
  node, level, onSelect, selectedId, renderActions,
  onDragStart, onDragOver, onDrop, onDragEnd, dragOverId, dragPosition,
  defaultExpanded,
}: {
  node: TreeNode; level: number;
  onSelect?: (node: TreeNode) => void;
  selectedId?: number | string;
  renderActions?: (node: TreeNode) => ReactNode;
  onDragStart: (e: DragEvent, node: TreeNode) => void;
  onDragOver: (e: DragEvent, node: TreeNode) => void;
  onDrop: (e: DragEvent, node: TreeNode) => void;
  onDragEnd: () => void;
  dragOverId?: number | string;
  dragPosition?: 'before' | 'after' | 'inside';
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isDropTarget = dragOverId === node.id;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={(e) => onDrop(e, node)}
        onDragEnd={onDragEnd}
        onClick={() => onSelect?.(node)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 8px', paddingLeft: level * 20 + 8,
          cursor: 'grab',
          background: isDropTarget && dragPosition === 'inside'
            ? '#dbeafe'
            : selectedId === node.id ? '#eff6ff' : 'transparent',
          borderRadius: 4, fontSize: 'var(--font-size-md)',
          borderTop: isDropTarget && dragPosition === 'before' ? '2px solid #3b82f6' : '2px solid transparent',
          borderBottom: isDropTarget && dragPosition === 'after' ? '2px solid #3b82f6' : '2px solid transparent',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <span style={{ cursor: 'grab', color: '#94a3b8', fontSize: 'var(--font-size-md)', lineHeight: 1, userSelect: 'none' }} title="드래그하여 순서 변경">☰</span>
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ cursor: 'pointer', fontSize: 'var(--font-size-sm)', width: 16, textAlign: 'center' }}
          >
            {expanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ width: 16 }} />
        )}
        <span style={{ flex: 1 }}>{node.label}</span>
        {renderActions?.(node)}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              renderActions={renderActions}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              dragOverId={dragOverId}
              dragPosition={dragPosition}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ nodes, onSelect, selectedId, renderActions, onReorder, defaultExpanded }: TreeViewProps) {
  const dragNodeRef = useRef<TreeNode | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | undefined>();
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside'>('after');
  // ref로 최신 dragPosition을 유지 (drop 시점에 stale state 방지)
  const dragPositionRef = useRef<'before' | 'after' | 'inside'>('after');

  /** 같은 부모(레벨)에 속한 형제 목록에서 해당 노드의 인덱스를 찾기 */
  const findSiblingInfo = useCallback((targetId: number | string, nodeList: TreeNode[], parentId: number | string | null): { parentId: number | string | null; index: number } | null => {
    for (let i = 0; i < nodeList.length; i++) {
      if (nodeList[i].id === targetId) {
        return { parentId, index: i };
      }
      if (nodeList[i].children?.length) {
        const found = findSiblingInfo(targetId, nodeList[i].children!, nodeList[i].id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const handleDragStart = useCallback((e: DragEvent, node: TreeNode) => {
    dragNodeRef.current = node;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent, node: TreeNode) => {
    e.preventDefault();
    if (!dragNodeRef.current || dragNodeRef.current.id === node.id) return;
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;

    let pos: 'before' | 'after' | 'inside';
    if (y < h * 0.25) {
      pos = 'before';
    } else if (y > h * 0.75) {
      pos = 'after';
    } else {
      pos = 'inside';
    }
    dragPositionRef.current = pos;
    setDragPosition(pos);
    setDragOverId(node.id);
  }, []);

  const handleDrop = useCallback((e: DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    if (!dragNodeRef.current || dragNodeRef.current.id === targetNode.id || !onReorder) return;

    const pos = dragPositionRef.current;

    if (pos === 'inside') {
      // 타겟 노드의 하위로 이동 (맨 마지막)
      const childCount = targetNode.children?.length ?? 0;
      onReorder(dragNodeRef.current.id, targetNode.id, childCount);
    } else {
      const targetInfo = findSiblingInfo(targetNode.id, nodes, null);
      if (!targetInfo) return;

      const newIndex = pos === 'before' ? targetInfo.index : targetInfo.index + 1;
      onReorder(dragNodeRef.current.id, targetInfo.parentId, newIndex);
    }

    dragNodeRef.current = null;
    setDragOverId(undefined);
  }, [nodes, onReorder, findSiblingInfo]);

  const handleDragEnd = useCallback(() => {
    dragNodeRef.current = null;
    setDragOverId(undefined);
  }, []);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 8 }}>
      {nodes.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 'var(--font-size-md)' }}>
          데이터가 없습니다
        </div>
      ) : (
        nodes.map(node => (
          <TreeItem
            key={node.id}
            node={node}
            level={0}
            onSelect={onSelect}
            selectedId={selectedId}
            renderActions={renderActions}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            dragOverId={dragOverId}
            dragPosition={dragPosition}
            defaultExpanded={defaultExpanded}
          />
        ))
      )}
    </div>
  );
}
