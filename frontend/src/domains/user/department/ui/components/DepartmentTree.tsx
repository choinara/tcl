import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { Department } from '../../types/department';

interface DepartmentTreeProps {
  departments: Department[];
  selectedId: number | null;
  onSelect: (dept: Department) => void;
}

interface TreeNodeProps {
  node: Department;
  level: number;
  selectedId: number | null;
  onSelect: (dept: Department) => void;
}

const TreeNode = ({ node, level, selectedId, onSelect }: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.deptId === selectedId;

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
        {expanded && hasChildren ? <FolderOpen size={16} className="text-[var(--color-primary)]" /> : <Folder size={16} className="text-[var(--color-text-secondary)]" />}
        <span className="text-sm">{node.deptName}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.deptId} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DepartmentTree = ({ departments, selectedId, onSelect }: DepartmentTreeProps) => {
  return (
    <div className="flex-1 overflow-auto">
      {departments.length === 0 ? (
        <div className="p-4 text-sm text-[var(--color-text-secondary)]">등록된 부서가 없습니다.</div>
      ) : (
        departments.map((dept) => (
          <TreeNode key={dept.deptId} node={dept} level={0} selectedId={selectedId} onSelect={onSelect} />
        ))
      )}
    </div>
  );
};

export default DepartmentTree;
