import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '@/shared/components/form';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import Input from '@/shared/components/input/Input';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { api } from '@/lib/api';
import type { ConditionSettingsData } from '../../types/systemSettings';

export const ConditionSettingsTab = () => {
  const { notify } = useToast();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['system-settings-condition'],
    queryFn: async () => { const res = await api.get<any>('/system/settings/condition'); return (res.data ?? {}) as ConditionSettingsData; },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: ConditionSettingsData) => api.put('/system/settings/condition', data),
    onSuccess: () => { notify('조건 설정이 저장되었습니다', { type: 'success' }); qc.invalidateQueries({ queryKey: ['system-settings-condition'] }); },
    onError: (err: any) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const { control, handleSubmit, reset } = useForm<ConditionSettingsData>({
    defaultValues: { defaultPageSize: 20, maxExportRows: 10000, searchDebounceMs: 300 },
  });

  useEffect(() => { if (settings) reset(settings); }, [settings, reset]);

  return (
    <CreateCardWrapper title="조건 설정" action={<PrimaryButton heightType="h32" onClick={handleSubmit((d) => save(d))} disabled={isPending}>{isPending ? '저장 중...' : '저장'}</PrimaryButton>}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="기본 페이지 크기">
              <Controller name="defaultPageSize" control={control} render={({ field }) => (
                <Input heightType="h40" type="number" value={String(field.value ?? 20)} onChange={(e: any) => field.onChange(Number(e.target.value))} style={{ width: 120 }} />
              )} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="최대 내보내기 행수">
              <Controller name="maxExportRows" control={control} render={({ field }) => (
                <Input heightType="h40" type="number" value={String(field.value ?? 10000)} onChange={(e: any) => field.onChange(Number(e.target.value))} style={{ width: 120 }} />
              )} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="검색 디바운스 (ms)">
              <Controller name="searchDebounceMs" control={control} render={({ field }) => (
                <Input heightType="h40" type="number" value={String(field.value ?? 300)} onChange={(e: any) => field.onChange(Number(e.target.value))} style={{ width: 120 }} />
              )} />
            </FormField>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </CreateCardWrapper>
  );
};

export default ConditionSettingsTab;
