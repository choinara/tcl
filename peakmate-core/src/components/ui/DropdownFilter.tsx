import { useMemo } from 'react';
import { FilterField } from './FilterField';
import { DropDown } from './DropDown';
import type { DropdownOption } from './DropDown';
import { useCommonCodes } from '../../hooks/useCommonCodes';

interface DropdownFilterProps {
  /** 필드 레이블. 빈 문자열 전달 시 레이블 없이 DropDown만 렌더링 */
  label?: string;
  /** 공통코드 그룹 코드 — options 미제공 시 자동 로드 */
  groupCode?: string;
  /** 직접 options 제공 시 groupCode보다 우선 */
  options?: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  /** "전체" 옵션 레이블. false 전달 시 전체 옵션 미생성 */
  allLabel?: string | false;
  width?: number | string;
  disabled?: boolean;
}

export function DropdownFilter({
  label = '',
  groupCode,
  options,
  value,
  onChange,
  allLabel = '전체',
  width = 120,
  disabled,
}: DropdownFilterProps) {
  const allCodes = useCommonCodes(...(groupCode ? [groupCode] : []));

  const resolvedOptions = useMemo<DropdownOption[]>(() => {
    const base: DropdownOption[] = options
      ? options
      : groupCode
        ? (allCodes[groupCode] ?? []).map(c => ({ value: c.code, label: c.codeName }))
        : [];

    if (allLabel === false) return base;
    return [{ value: '', label: allLabel }, ...base];
  }, [options, groupCode, allCodes, allLabel]);

  const select = (
    <DropDown
      options={resolvedOptions}
      value={value}
      onChange={e => onChange(String(e.target.value))}
      btnWidth={width}
      heightType="h32"
      disabled={disabled}
    />
  );

  if (!label) return select;

  return (
    <FilterField label={label}>
      {select}
    </FilterField>
  );
}
