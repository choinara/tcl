import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '@/shared/components/form';
import { PrimaryButton } from '@/shared/components/button/CustomButton';
import { CustomRadio } from '@/shared/components/radio/radio';
import Input from '@/shared/components/input/Input';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { useToast } from '@/shared/components/toast/useToast';
import { api } from '@/lib/api';
import type { SystemSettingsData } from '../../types/systemSettings';

export const SystemSettingsTab = () => {
  const { notify } = useToast();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['system-settings-general'],
    queryFn: async () => { const res = await api.get<SystemSettingsData>('/system/settings/general'); return (res.data ?? {}) as SystemSettingsData; },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: SystemSettingsData) => api.put('/system/settings/general', data),
    onSuccess: () => { notify('시스템 설정이 저장되었습니다', { type: 'success' }); qc.invalidateQueries({ queryKey: ['system-settings-general'] }); },
    onError: (err: Error) => { notify(`저장 실패: ${err.message}`, { type: 'error' }); },
  });

  const { control, handleSubmit, reset } = useForm<SystemSettingsData>({
    defaultValues: { siteName: '', siteDescription: '', defaultLanguage: 'ko', timezone: 'Asia/Seoul', maintenanceMode: false },
  });

  useEffect(() => { if (settings) reset(settings); }, [settings, reset]);

  return (
    <CreateCardWrapper title="시스템 설정" action={<PrimaryButton heightType="h32" onClick={handleSubmit((d) => save(d))} disabled={isPending}>{isPending ? '저장 중...' : '저장'}</PrimaryButton>}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="사이트명">
              <Controller name="siteName" control={control} render={({ field }) => (
                <Input heightType="h40" value={field.value || ''} onChange={field.onChange} placeholder="사이트명 입력" style={{ flex: 1 }} showClearButton={true} />
              )} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="기본 언어">
              <Controller name="defaultLanguage" control={control} render={({ field }) => (
                <div className="flex flex-row gap-2">
                  {[{ value: 'ko', label: '한국어' }, { value: 'en', label: 'English' }].map((opt) => (
                    <CustomRadio key={opt.value} value={opt.value} label={opt.label} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                  ))}
                </div>
              )} />
            </FormField>
          </div>
        </div>
        <FormField label="사이트 설명">
          <Controller name="siteDescription" control={control} render={({ field }) => (
            <Input heightType="h40" value={field.value || ''} onChange={field.onChange} placeholder="사이트 설명 입력" layout="long" style={{ flex: 1 }} />
          )} />
        </FormField>
        <div className="flex gap-6">
          <div className="flex-1">
            <FormField label="타임존">
              <Controller name="timezone" control={control} render={({ field }) => (
                <Input heightType="h40" value={field.value || ''} onChange={field.onChange} placeholder="타임존" style={{ flex: 1 }} showClearButton={true} />
              )} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="점검 모드">
              <Controller name="maintenanceMode" control={control} render={({ field }) => (
                <div className="flex flex-row gap-2">
                  {[{ value: true, label: '활성' }, { value: false, label: '비활성' }].map((opt) => (
                    <CustomRadio key={String(opt.value)} value={String(opt.value)} label={opt.label} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                  ))}
                </div>
              )} />
            </FormField>
          </div>
        </div>
      </div>
    </CreateCardWrapper>
  );
};

export default SystemSettingsTab;
