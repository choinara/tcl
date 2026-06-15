import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FormField } from '@/shared/components/form';
import { GhostButton, PrimaryButton } from '@/shared/components/button/CustomButton';
import { CustomRadio } from '@/shared/components/radio/radio';
import Input from '@/shared/components/input/Input';
import type { Menu, MenuFormData } from '../../types/menu';

interface MenuFormProps {
  menu: Menu | null;
  onSave: (data: MenuFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

const VISIBLE_OPTIONS = [
  { value: 'Y', label: '표시' },
  { value: 'N', label: '숨김' },
];

const USE_YN_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export const MenuForm = ({ menu, onSave, onDelete, isLoading }: MenuFormProps) => {
  const { control, handleSubmit, reset } = useForm<MenuFormData>({
    defaultValues: {
      menuCode: '',
      menuName: '',
      menuPath: '',
      parentMenuId: null,
      icon: '',
      visible: 'Y',
      sortOrder: 0,
      useYn: 'Y',
    },
  });

  useEffect(() => {
    if (menu) {
      reset({
        menuCode: menu.menuCode || '',
        menuName: menu.menuName || '',
        menuPath: menu.menuPath || '',
        parentMenuId: menu.parentMenuId ?? null,
        icon: menu.icon || '',
        visible: menu.visible || 'Y',
        sortOrder: menu.sortOrder ?? 0,
        useYn: menu.useYn || 'Y',
      });
    }
  }, [menu, reset]);

  if (!menu) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        좌측 트리에서 메뉴를 선택하세요.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold">{menu.menuName || '신규 메뉴'} 상세</h3>
        <div className="flex gap-1">
          {onDelete && <GhostButton heightType="h32" onClick={onDelete}>삭제</GhostButton>}
          <PrimaryButton heightType="h32" onClick={handleSubmit(onSave)} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </PrimaryButton>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="flex flex-col gap-5">
          <FormField label="메뉴코드" required>
            <Controller name="menuCode" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="메뉴코드 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="메뉴명" required>
            <Controller name="menuName" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="메뉴명 입력" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="메뉴경로">
            <Controller name="menuPath" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="/path (예: /artists)" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="아이콘">
            <Controller name="icon" control={control} render={({ field }) => (
              <Input heightType="h40" value={field.value} onChange={field.onChange} placeholder="아이콘명 입력 (예: layers)" style={{ flex: 1 }} showClearButton={true} />
            )} />
          </FormField>

          <FormField label="정렬순서">
            <Controller name="sortOrder" control={control} render={({ field }) => (
              <Input heightType="h40" type="number" value={String(field.value)} onChange={(e: any) => field.onChange(Number(e.target.value))} style={{ width: 120 }} />
            )} />
          </FormField>

          <FormField label="표시 여부" required>
            <Controller name="visible" control={control} render={({ field }) => (
              <div className="flex flex-row gap-2">
                {VISIBLE_OPTIONS.map((opt) => (
                  <CustomRadio key={opt.value} value={opt.value} label={opt.label} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                ))}
              </div>
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

export default MenuForm;
