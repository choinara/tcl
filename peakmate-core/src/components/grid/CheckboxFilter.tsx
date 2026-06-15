import { useState, useEffect, useCallback } from 'react';
import { useGridFilter } from 'ag-grid-react';
import type { CustomFilterProps } from 'ag-grid-react';
import type { IDoesFilterPassParams } from 'ag-grid-community';

/**
 * AG Grid 커스텀 Set Filter (Community 에디션용, reactive 모드)
 * reactiveCustomComponents={true} 필수
 * Enterprise 전환 시 → colDef.filter: 'agSetColumnFilter' 로 교체
 */
export function CheckboxFilter(props: CustomFilterProps) {
  const { api, colDef, model, onModelChange } = props;
  const field = colDef.field!;

  const [uniqueValues, setUniqueValues] = useState<string[]>([]);

  // model에서 selected 복원 (없으면 전체 선택)
  const selected: Set<string> = model ? new Set(model.values as string[]) : new Set(uniqueValues);

  // 유니크 값 추출
  useEffect(() => {
    const values = new Set<string>();
    api.forEachNode((node) => {
      if (node.data) {
        const val = node.data[field];
        values.add(val == null ? '' : String(val));
      }
    });
    setUniqueValues(Array.from(values).sort());
  }, [api, field]);

  // doesFilterPass를 useGridFilter 훅으로 등록
  const doesFilterPass = useCallback(
    (params: IDoesFilterPassParams) => {
      const val = params.data[field];
      const str = val == null ? '' : String(val);
      return selected.has(str);
    },
    [field, selected],
  );

  useGridFilter({ doesFilterPass });

  const handleToggle = (val: string) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    // 전체 선택이면 model=null (필터 비활성), 아니면 선택된 값 배열
    if (next.size >= uniqueValues.length) {
      onModelChange(null);
    } else {
      onModelChange({ values: Array.from(next) });
    }
  };

  const handleSelectAll = () => {
    if (selected.size === uniqueValues.length) {
      // 전체 해제
      onModelChange({ values: [] });
    } else {
      // 전체 선택 → 필터 비활성
      onModelChange(null);
    }
  };

  const allSelected = !model && uniqueValues.length > 0;

  return (
    <div style={{ padding: 8, minWidth: 160, maxHeight: 300, overflow: 'auto', fontSize: 'var(--grid-font-size)' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={handleSelectAll}
        />
        전체 {allSelected ? '해제' : '선택'}
      </label>
      <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
      {uniqueValues.map((val) => (
        <label
          key={val}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={selected.has(val)}
            onChange={() => handleToggle(val)}
          />
          {val || '(빈값)'}
        </label>
      ))}
    </div>
  );
}
