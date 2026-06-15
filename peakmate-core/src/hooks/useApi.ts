import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PagedResponse, ApiResponse } from '@/components/grid/types';

function getAuthHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

/**
 * 서버사이드 페이징 그리드 조회 훅
 */
export function useGridQuery<T>(
  key: string[],
  url: string,
  params?: Record<string, string | number | undefined>
) {
  return useQuery<PagedResponse<T>>({
    queryKey: [...key, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            searchParams.set(k, String(v));
          }
        });
      }
      const queryString = searchParams.toString();
      const fullUrl = `/api${url}${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(fullUrl, { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      const json: ApiResponse<PagedResponse<T>> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * 일괄 저장 훅 (Toast UI Grid용)
 */
export function useBatchSave<T>(url: string, queryKey: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: T[]) => {
      const res = await fetch(`/api${url}/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error('요청 처리에 실패했습니다.');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}
