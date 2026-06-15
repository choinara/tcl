export interface CodeItem {
  code: string;
  codeName: string;
}

export function codeName(codes: CodeItem[], value: unknown): string {
  if (value == null || value === '') return '';
  const found = codes.find(c => c.code === value);
  return found ? found.codeName : String(value);
}

export function codeFormatter(codes: CodeItem[]) {
  return (p: { value: unknown }) => {
    const found = codes.find(c => c.code === p.value);
    return found ? found.codeName : ((p.value as string) ?? '');
  };
}

/**
 * Record<group, CodeItem[]> 로부터 (group, code) → codeName O(1) 룩업 함수를 생성한다.
 * 매칭 없으면 code 원본 반환, null/빈값은 빈 문자열.
 */
export function makeCodeNameOf(allCodes: Record<string, CodeItem[]>) {
  const lookup = new Map<string, Map<string, string>>();
  for (const [group, list] of Object.entries(allCodes)) {
    const m = new Map<string, string>();
    for (const c of list ?? []) m.set(c.code, c.codeName);
    lookup.set(group, m);
  }
  return (group: string, code: string | null | undefined): string => {
    if (!code) return '';
    return lookup.get(group)?.get(code) ?? code;
  };
}
