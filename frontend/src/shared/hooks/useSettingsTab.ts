import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { coreNotify } from '@/stores/useNotifyStore';

interface UseSettingsTabOptions<T extends Record<string, unknown>> {
  queryKey: string;
  apiPath: string;
  defaultValues: T;
  successMessage: string;
}

interface UseSettingsTabReturn<T extends Record<string, unknown>> {
  formMethods: UseFormReturn<T>;
  isPending: boolean;
  onSubmit: (data: T) => void;
}

/**
 * 시스템 설정 탭 공통 패턴(조회 → 폼 리셋 → 저장 → 캐시 무효화) 추상화 훅.
 */
export function useSettingsTab<T extends Record<string, unknown>>({
  queryKey,
  apiPath,
  defaultValues,
  successMessage,
}: UseSettingsTabOptions<T>): UseSettingsTabReturn<T> {
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await authFetch(`/api${apiPath}`);
      const json: { data?: T } = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      return (json.data ?? {}) as T;
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data: T) => {
      const res = await authFetch(`/api${apiPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('저장 실패');
    },
    onSuccess: () => {
      coreNotify(successMessage, { type: 'success' });
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: () => {
      coreNotify('설정 저장 중 오류가 발생했습니다.', { type: 'error' });
    },
  });

  const formMethods = useForm<T>({ defaultValues: defaultValues as Parameters<typeof useForm<T>>[0]['defaultValues'] });

  useEffect(() => {
    if (settings) formMethods.reset(settings as Parameters<typeof formMethods.reset>[0]);
  }, [settings, formMethods.reset]);

  const onSubmit = (data: T) => save(data);

  return { formMethods, isPending, onSubmit };
}
