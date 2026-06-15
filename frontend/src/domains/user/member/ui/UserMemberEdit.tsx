import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { FormField } from '@/shared/components/form';
import { GhostButton, PrimaryButton } from '@/shared/components/button/CustomButton';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { PageHeader } from '@/shared/components/header';
import Input from '@/shared/components/input/Input';
import { CustomRadio } from '@/shared/components/radio/radio';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { api } from '@/lib/api';
import type { AdminUserFormData } from '../types/adminUser';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
];

export const UserMemberEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const { data: record } = useQuery({
    queryKey: ['admin-users', id],
    queryFn: async () => { const res = await api.get<any>(`/admin/users/${id}`); return res.data; },
    enabled: !!id,
  });

  const { mutate: updateUser, isPending: isLoading } = useMutation({
    mutationFn: (data: any) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      notify('사용자가 수정되었습니다', { type: 'success' });
      navigate(`/system/users/${id}/show`);
    },
    onError: (error: any) => {
      notify(`수정 실패: ${error.message}`, { type: 'error' });
    },
  });

  const { control, handleSubmit, reset } = useForm<AdminUserFormData>({
    defaultValues: {
      loginId: '',
      userName: '',
      password: '',
      passwordConfirm: '',
      deptName: '',
      position: '',
      email: '',
      employeeNumber: '',
      status: 'ACTIVE',
      roleId: '',
    },
  });

  useEffect(() => {
    if (record) {
      reset({
        loginId: record.loginId || '',
        userName: record.userName || '',
        password: '',
        passwordConfirm: '',
        deptName: record.deptName || '',
        position: record.position || '',
        email: record.email || '',
        employeeNumber: record.employeeNumber || '',
        status: record.status || 'ACTIVE',
        roleId: record.roleId || '',
      });
    }
  }, [record, reset]);

  const onSubmit = (data: AdminUserFormData) => {
    if (data.password && data.password !== data.passwordConfirm) {
      notify('비밀번호가 일치하지 않습니다', { type: 'error' });
      return;
    }
    const { passwordConfirm, ...apiData } = data;
    if (!apiData.password) delete apiData.password;
    updateUser(apiData);
  };

  if (!record) return null;

  return (
    <div>
      <PageHeader
        title={`[${record.userId}] ${record.userName}`}
        showBackButton={true}
        onBack={() => navigate(`/system/users/${id}/show`)}
        subtitle="사용자 정보를 수정합니다."
        rightContent={
          <div className="flex gap-1">
            <GhostButton heightType="h40" onClick={() => navigate(`/system/users/${id}/show`)} disabled={isLoading}>취소</GhostButton>
            <PrimaryButton heightType="h40" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? '수정 중...' : '수정'}
            </PrimaryButton>
          </div>
        }
      />

      <div className="flex-1 overflow-auto flex flex-col items-center py-6">
        <div className="w-full max-w-[925px]">
          <CreateCardWrapper title="사용자 기본정보">
            <form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="flex flex-col gap-6">
                <div className="flex gap-6">
                  <div className="flex-1">
                    <FormField label="사용자ID" required>
                      <Controller name="loginId" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} readOnly style={{ flex: 1 }} />
                      )} />
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField label="이름" required>
                      <Controller name="userName" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="이름 입력" style={{ flex: 1 }} showClearButton={true} />
                      )} />
                    </FormField>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1">
                    <FormField label="비밀번호">
                      <Controller name="password" control={control} render={({ field }) => (
                        <Input heightType="h40" type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="변경 시에만 입력" style={{ flex: 1 }} showClearButton={false} />
                      )} />
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField label="비밀번호 확인">
                      <Controller name="passwordConfirm" control={control} render={({ field }) => (
                        <Input heightType="h40" type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="비밀번호 확인" style={{ flex: 1 }} showClearButton={false} />
                      )} />
                    </FormField>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1">
                    <FormField label="부서">
                      <Controller name="deptName" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="부서 입력" style={{ flex: 1 }} showClearButton={true} />
                      )} />
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField label="직급">
                      <Controller name="position" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="직급 입력" style={{ flex: 1 }} showClearButton={true} />
                      )} />
                    </FormField>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1">
                    <FormField label="이메일">
                      <Controller name="email" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="이메일 입력" style={{ flex: 1 }} showClearButton={true} />
                      )} />
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField label="사번">
                      <Controller name="employeeNumber" control={control} render={({ field }) => (
                        <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="사번 입력" style={{ flex: 1 }} showClearButton={true} />
                      )} />
                    </FormField>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1">
                    <FormField label="상태" required>
                      <Controller name="status" control={control} render={({ field }) => (
                        <div className="flex flex-row gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <CustomRadio key={opt.value} value={opt.value} label={opt.label} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                          ))}
                        </div>
                      )} />
                    </FormField>
                  </div>
                  <div className="flex-1" />
                </div>
              </div>
            </form>
          </CreateCardWrapper>
        </div>
      </div>
    </div>
  );
};

export default UserMemberEdit;
