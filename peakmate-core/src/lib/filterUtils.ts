export function filterByAllOption<T>(
  data: T[],
  value: string,
  getter: (item: T) => string,
  allLabel = '전체',
): T[] {
  return value === allLabel ? data : data.filter(item => getter(item) === value);
}

export function filterByText<T>(
  data: T[],
  query: string,
  getter: (item: T) => string,
  caseSensitive = false,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return data;
  const q = caseSensitive ? trimmed : trimmed.toLowerCase();
  return data.filter(item => {
    const v = getter(item);
    return (caseSensitive ? v : v.toLowerCase()).includes(q);
  });
}
