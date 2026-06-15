import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderOpen } from 'lucide-react';
import type { Menu } from '../../types/menu';

interface MenuTreeProps {
  menus: Menu[];
  selectedId: number | null;
  onSelect: (menu: Menu) => void;
}

interface TreeNodeProps {
  node: Menu;
  level: number;
  selectedId: number | null;
  onSelect: (menu: Menu) => void;
}

const TreeNode = ({ node, level, selectedId, onSelect }: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.menuId === selectedId;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 cursor-pointer rounded transition-colors ${isSelected ? 'bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)]' : 'hover:bg-[var(--color-bg-hover)]'}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}
        {hasChildren ? <FolderOpen size={16} className="text-[var(--color-primary)]" /> : <FileText size={16} className="text-[var(--color-text-secondary)]" />}
        <span className="text-sm">{node.menuName}</span>
        {node.visible === 'N' && <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">(숨김)</span>}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.menuId} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MenuTree = ({ menus, selectedId, onSelect }: MenuTreeProps) => {
  return (
    <div className="flex-1 overflow-auto">
      {menus.length === 0 ? (
        <div className="p-4 text-sm text-[var(--color-text-secondary)]">등록된 메뉴가 없습니다.</div>
      ) : (
        menus.map((menu) => (
          <TreeNode key={menu.menuId} node={menu} level={0} selectedId={selectedId} onSelect={onSelect} />
        ))
      )}
    </div>
  );
};

export default MenuTree;
