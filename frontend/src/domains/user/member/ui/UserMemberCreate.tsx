import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { FormField } from '@/shared/components/form';
import { GhostButton, PrimaryButton } from '@/shared/components/button/CustomButton';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { PageHeader } from '@/shared/components/header';
import Input from '@/shared/components/input/Input';
import { CustomRadio } from '@/shared/components/radio/radio';
import { useToast } from '@/shared/components/toast/useToast';
import { api } from '@/lib/api';
import type { AdminUserFormData } from '../types/adminUser';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
];

export const UserMemberCreate = () => {
  const navigate = useNavigate();
  const { notify } = useToast();

  const { mutate: createUser, isPending: isLoading } = useMutation({
    mutationFn: (data: Omit<AdminUserFormData, 'passwordConfirm'>) => api.post('/admin/users', data),
    onSuccess: () => {
      notify('사용자가 등록되었습니다', { type: 'success' });
      navigate('/system/users');
    },
    onError: (error: Error) => {
      notify(`등록 실패: ${error.message}`, { type: 'error' });
    },
  });

  const { control, handleSubmit } = useForm<AdminUserFormData>({
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

  const onSubmit = (data: AdminUserFormData) => {
    if (data.password !== data.passwordConfirm) {
      notify('비밀번호가 일치하지 않습니다', { type: 'error' });
      return;
    }
    const { passwordConfirm: _, ...apiData } = data;
    void _;
    createUser(apiData);
  };

  return (
    <div>
      <PageHeader
        title="사용자 등록"
        showBackButton={true}
        onBack={() => navigate('/system/users')}
        subtitle="신규 사용자를 등록하는 페이지입니다."
        rightContent={
          <div className="flex gap-1">
            <GhostButton heightType="h40" onClick={() => navigate('/system/users')} disabled={isLoading}>취소</GhostButton>
            <PrimaryButton heightType="h40" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? '등록 중...' : '등록'}
            </PrimaryButton>
          </div>
        }
      />

      <div className="flex-1 overflow-auto flex flex-col items-center py-6">
        <CreateCardWrapper sx={{ width: '925px', boxSizing: 'content-box' }} title="사용자 기본정보">
          <form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="flex flex-col gap-6">
              {/* Row 1: 사용자ID | 이름 */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="사용자ID" required>
                    <Controller name="loginId" control={control} render={({ field }) => (
                      <Input heightType="h40" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="사용자ID 입력" style={{ flex: 1 }} showClearButton={true} />
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

              {/* Row 2: 비밀번호 | 비밀번호 확인 */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="비밀번호" required>
                    <Controller name="password" control={control} render={({ field }) => (
                      <Input heightType="h40" type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="비밀번호 입력" style={{ flex: 1 }} showClearButton={false} />
                    )} />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="비밀번호 확인" required>
                    <Controller name="passwordConfirm" control={control} render={({ field }) => (
                      <Input heightType="h40" type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="비밀번호 확인" style={{ flex: 1 }} showClearButton={false} />
                    )} />
                  </FormField>
                </div>
              </div>

              {/* Row 3: 부서 | 직급 */}
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

              {/* Row 4: 이메일 | 사번 */}
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

              {/* Row 5: 상태 */}
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
  );
};

export default UserMemberCreate;
