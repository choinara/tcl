import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FormField } from '@/shared/components/form';
import { GhostButton, PrimaryButton } from '@/shared/components/button/CustomButton';
import { CustomRadio } from '@/shared/components/radio/radio';
import Input from '@/shared/components/input/Input';
import type { Department, DepartmentFormData } from '../../types/department';

interface DepartmentFormProps {
  department: Department | null;
  onSave: (data: DepartmentFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

const USE_YN_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export const DepartmentForm = ({ department, onSave, onDelete, isLoading }: DepartmentFormProps) => {
  const { control, handleSubmit, reset } = useForm<DepartmentFormData>({
    defaultValues: {
      deptCode: '',
      deptName: '',
      parentDeptId: null,
      managerName: '',
      phone: '',
      sortOrder: 0,
      useYn: 'Y',
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        deptCode: department.deptCode || '',
        deptName: department.deptName || '',
        parentDeptId: department.parentDeptId ?? null,
        managerName: department.managerName || '',
        phone: department.phone || '',
        sortOrder: department.sortOrder ?? 0,
        useYn: department.useYn || 'Y',
      });
    }
  }, [department, reset]);

  if (!department) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        좌측 트리에서 부서를 선택하세요.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold">{department.deptName} 상세</h3>
        <div className="flex gap-1">
          {onDelete && <GhostButton heightType="h32" onClick={onDelete}>삭제</GhostButton>}
          <PrimaryButton heightType="h32" onClick={handleSubmit(onSave)} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </PrimaryButton>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="flex flex-col gap-5">
          <FormField label="부서코드" required>
            <Controller name="deptCode" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="부서코드 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="부서명" required>
            <Controller name="deptName" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="부서명 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="부서장">
            <Controller name="managerName" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="부서장 이름 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="전화">
            <Controller name="phone" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="전화번호 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="정렬순서">
            <Controller name="sortOrder" control={control} render={({ field }) => (
              <Input heightType="h40" type="number" value={String(field.value)} onChange={(val: string) => field.onChange(Number(val))} style={{ width: 120 }} />
            )} />
          </FormField>

          <FormField label="사용여부" required>
            <Controller name="useYn" control={control} render={({ field }) => (
              <div className="flex flex-row gap-2">
                {USE_YN_OPTIONS.map((opt) => (
                  <CustomRadio key={opt.value} value={opt.value} label={opt.label} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                ))}
              </div>
            )} />
          </FormField>
        </div>
      </div>
    </div>
  );
};

export default DepartmentForm;
