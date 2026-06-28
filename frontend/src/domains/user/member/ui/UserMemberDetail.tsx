import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FormField } from '@/shared/components/form';
import { GhostButton, GrayButton } from '@/shared/components/button/CustomButton';
import { CreateCardWrapper } from '@/shared/components/card/CreateCardWrapper';
import { PageHeader } from '@/shared/components/header';
import Input from '@/shared/components/input/Input';
import { RecordMeta } from '@/shared/components/record-meta/RecordMeta';
import { api } from '@/lib/api';
import type { AdminUser } from '../types/adminUser';

export const UserMemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: record } = useQuery({
    queryKey: ['admin-users', id],
    queryFn: async () => { const res = await api.get<AdminUser>(`/admin/users/${id}`); return res.data; },
    enabled: !!id,
  });

  if (!record) return null;

  return (
    <div>
      <PageHeader
        title={`[${record.userId}] ${record.userName}`}
        showBackButton={true}
        onBack={() => navigate('/system/users')}
        subtitle={`${record.deptName || ''} / ${record.position || ''}`}
        rightContent={<GhostButton heightType="h40" onClick={() => navigate('/system/users')}>목록으로</GhostButton>}
      />

      <div className="flex-1 overflow-auto flex flex-col items-center mb-5">
        <RecordMeta fields={[
          { label: '등록자', value: record.createId },
          { label: '등록일', value: record.createDt },
          { label: '최종 수정일', value: record.updateDt },
        ]} width="925px" />

        <div className="w-full max-w-[925px]">
          <CreateCardWrapper
            title="사용자 기본정보"
            action={<GrayButton btnWidth={44} heightType="h32" onClick={() => navigate(`/system/users/${record.userId}`)}>수정</GrayButton>}
          >
            <div className="flex flex-col gap-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="사용자ID">
                    <Input heightType="h40" value={record.loginId || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="이름">
                    <Input heightType="h40" value={record.userName || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="부서">
                    <Input heightType="h40" value={record.deptName || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="직급">
                    <Input heightType="h40" value={record.position || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="이메일">
                    <Input heightType="h40" value={record.email || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="사번">
                    <Input heightType="h40" value={record.employeeNumber || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <FormField label="상태">
                    <Input heightType="h40" value={record.status || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
                <div className="flex-1">
                  <FormField label="역할">
                    <Input heightType="h40" value={record.roleName || ''} readOnly style={{ flex: 1 }} />
                  </FormField>
                </div>
              </div>
            </div>
          </CreateCardWrapper>
        </div>
      </div>
    </div>
  );
};

export default UserMemberDetail;
