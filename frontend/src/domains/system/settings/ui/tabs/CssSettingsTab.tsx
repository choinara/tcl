import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '@/shared/components/form';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import Input from '@/shared/components/input/Input';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { api } from '@/lib/api';
import type { CssSettingsData } from '../../types/systemSettings';

export const CssSettingsTab = () => {
  const { notify } = useToast();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['system-settings-css'],
    queryFn: async () => { const res = await api.get<any>('/system/settings/css'); return (res.data ?? {}) as CssSettingsData; },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: CssSettingsData) => api.put('/system/settings/css', data),
    onSuccess: () => { notify('CSS 설정이 저장되었습니다', { type: 'success' }); qc.invalidateQueries({ queryKey: ['system-settings-css'] }); },
    onError: (err: any) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const { control, handleSubmit, reset } = useForm<CssSettingsData>({
    defaultValues: { primaryColor: '#3b82f6', backgroundColor: '#ffffff', fontSize: '14', customCss: '' },
  });

  useEffect(() => { if (settings) reset(settings); }, [settings, reset]);

  return (
    <CreateCardWrapper title="CSS 설정" action={<PrimaryButton heightType="h32" onClick={handleSubmit((d) => save(d))} disabled={isPending}>{isPending ? '저장 중...' : '저장'}</PrimaryButton>}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="기본 색상">
              <Controller name="primaryColor" control={control} render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input type="color" value={field.value || '#3b82f6'} onChange={field.onChange} className="w-10 h-10 rounded border border-[var(--color-border)] cursor-pointer" />
                  <Input heightType="h40" value={field.value || ''} onChange={field.onChange} style={{ width: 120 }} />
                </div>
              )} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="배경 색상">
              <Controller name="backgroundColor" control={control} render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input type="color" value={field.value || '#ffffff'} onChange={field.onChange} className="w-10 h-10 rounded border border-[var(--color-border)] cursor-pointer" />
                  <Input heightType="h40" value={field.value || ''} onChange={field.onChange} style={{ width: 120 }} />
                </div>
              )} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="기본 폰트 크기 (px)">
              <Controller name="fontSize" control={control} render={({ field }) => (
                <Input heightType="h40" type="number" value={field.value || '14'} onChange={field.onChange} style={{ width: 120 }} />
              )} />
            </FormField>
          </div>
          <div className="flex-1" />
        </div>
        <FormField label="커스텀 CSS">
          <Controller name="customCss" control={control} render={({ field }) => (
            <Input heightType="h40" value={field.value || ''} onChange={field.onChange} placeholder="커스텀 CSS 입력" type="long" rows={6} style={{ flex: 1 }} />
          )} />
        </FormField>
      </div>
    </CreateCardWrapper>
  );
};

export default CssSettingsTab;
