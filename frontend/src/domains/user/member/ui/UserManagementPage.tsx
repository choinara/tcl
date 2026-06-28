import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/useToast';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  employeeNumber: string;
  enabled: boolean;
  roles: string[];
  departmentId: number | null;
  positionId: number | null;
  companyId: number | null;
  userType: string;
  partnerId: number | null;
}

interface UserForm {
  username: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  employeeNumber: string;
  departmentId: number | null;
  positionId: number | null;
  roleName: string;
  companyId: number | null;
  userType: string;
  partnerId: number | null;
}

interface Department {
  id: number;
  deptCode: string;
  deptName: string;
}

interface Position {
  id: number;
  positionCode: string;
  positionName: string;
  autoRole: string;
}

interface Company {
  id: number;
  companyCode: string;
  companyName: string;
}

interface Partner {
  id: number;
  partnerCode: string;
  partnerName: string;
}

interface RoleItem {
  id: number;
  roleCode: string;
  roleName: string;
  description: string;
}

const emptyForm: UserForm = {
  username: '',
  password: '',
  passwordConfirm: '',
  name: '',
  email: '',
  employeeNumber: '',
  departmentId: null,
  positionId: null,
  roleName: '',
  companyId: null,
  userType: 'INTERNAL',
  partnerId: null,
};

export default function UserManagementPage() {
  const perm = usePermission('UM0010');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [piiModalOpen, setPiiModalOpen] = useState(false);
  const [piiData, setPiiData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/organization/departments/all');
        if (res.ok) {
          const json = await res.json();
          setDepartments(json.data || []);
        }
      } catch {
        notify('부서 목록 조회에 실패했습니다', { type: 'error' });
      }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/organization/positions/all');
        if (res.ok) {
          const json = await res.json();
          setPositions(json.data || []);
        }
      } catch {
        notify('직급 목록 조회에 실패했습니다', { type: 'error' });
      }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/organization/companies/all');
        if (res.ok) {
          const json = await res.json();
          setCompanies(json.data || []);
        }
      } catch {
        notify('업체 목록 조회에 실패했습니다', { type: 'error' });
      }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/master/partners/all');
        if (res.ok) {
          const json = await res.json();
          setPartners(json.data || []);
        }
      } catch {
        notify('협력업체 목록 조회에 실패했습니다', { type: 'error' });
      }
    })();
    (async () => {
      try {
        const res = await authFetch('/api/system/roles');
        if (res.ok) {
          const json = await res.json();
          const d = json.data;
          setRoles(Array.isArray(d) ? d : (d?.content || []));
        }
      } catch {
        notify('역할 목록 조회에 실패했습니다', { type: 'error' });
      }
    })();
  }, [notify]);

  const handleChange = useCallback((field: keyof UserForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedUser(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setForm({
      username: user.username,
      password: '',
      passwordConfirm: '',
      name: user.name,
      email: user.email,
      employeeNumber: user.employeeNumber,
      departmentId: user.departmentId,
      positionId: user.positionId,
      roleName: user.roles?.[0] || '',
      companyId: user.companyId,
      userType: user.userType || 'INTERNAL',
      partnerId: user.partnerId,
    });
    setErrors({});
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSelectedUser(null);
    setForm(emptyForm);
    setErrors({});
  }, []);

  const handlePositionChange = useCallback((positionId: number | null) => {
    setForm(prev => {
      const pos = positions.find(p => p.id === positionId);
      return {
        ...prev,
        positionId,
        roleName: pos?.autoRole || prev.roleName,
      };
    });
  }, [positions]);

  const validate = useCallback((): boolean => {
    const isEdit = selectedUser !== null;
    const newErrors: Record<string, string> = {};
    if (!isEdit && !form.username.trim()) newErrors.username = '사용자ID는 필수입니다.';
    if (!form.name.trim()) newErrors.name = '이름은 필수입니다.';
    if (!isEdit && !form.password) newErrors.password = '비밀번호는 필수입니다.';
    if (form.password && form.password !== form.passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, selectedUser]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    const isEdit = selectedUser !== null;

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/system/users/${selectedUser.id}`
        : '/api/system/users';
      const method = isEdit ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        username: form.username,
        password: form.password || undefined,
        name: form.name,
        email: form.email,
        employeeNumber: form.employeeNumber,
        roles: form.roleName ? [form.roleName] : [],
        companyId: form.companyId,
        userType: form.userType,
        partnerId: form.userType === 'EXTERNAL' ? form.partnerId : null,
        departmentId: form.userType === 'INTERNAL' ? form.departmentId : null,
        positionId: form.userType === 'INTERNAL' ? form.positionId : null,
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        const msg = errorBody?.message || '요청 처리에 실패했습니다.';
        throw new Error(msg);
      }

      setRefetchTrigger(prev => prev + 1);
      notify(isEdit ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      handleClose();
    } catch (err) {
      notify('저장에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, selectedUser, handleClose, validate, notify]);

  const handleResetPassword = useCallback(async (user: User) => {
    if (!await confirmDialog(`[${user.username}] 사용자의 비밀번호를 초기화하시겠습니까?\n임시 비밀번호가 발급됩니다.`)) return;

    try {
      const res = await authFetch(`/api/system/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(errorBody?.message || '요청 처리에 실패했습니다.');
      }
      const json = await res.json();
      const { emailSent, tempPassword, message } = json.data;
      if (emailSent) {
        notify(message, { type: 'success' });
      } else {
        notify(`임시 비밀번호: ${tempPassword}\n${message}`, { type: 'success', duration: 15000 });
      }
    } catch (err) {
      notify('비밀번호 초기화 실패: ' + (err instanceof Error ? err.message : String(err)), { type: 'error' });
    }
  }, [notify, confirmDialog]);

  const handleViewPii = useCallback(async (user: User) => {
    try {
      const res = await authFetch(`/api/system/users/${user.id}/pii`);
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(errorBody?.message || '요청 처리에 실패했습니다.');
      }
      const json = await res.json();
      setPiiData(json.data);
      setPiiModalOpen(true);
    } catch {
      notify('PII 열람 권한이 없습니다', { type: 'error' });
    }
  }, [notify]);

  const selectStyle: React.CSSProperties = { width: '100%' };

  const filterSelectStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #d1d5db',
    borderRadius: 4, fontSize: 13, boxSizing: 'border-box',
  };

  const columns: ColDef<User>[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 60, hide: true },
    { field: 'username', headerName: '사용자ID', width: 120 },
    { field: 'name', headerName: '이름', width: 100 },
    {
      field: 'userType',
      headerName: '사용자유형',
      width: 90,
      valueFormatter: (p) => {
        const v = p.value as string;
        return v === 'EXTERNAL' ? '외부직원' : '내부직원';
      },
    },
    {
      colId: 'roleName',
      headerName: '역할',
      width: 100,
      valueGetter: (p) => {
        const r = p.data?.roles;
        return r?.length ? r.join(', ') : '-';
      },
    },
    {
      field: 'companyId',
      headerName: '소속회사',
      width: 120,
      valueGetter: (p) => {
        const user = p.data;
        if (!user) return '';
        if (user.userType === 'EXTERNAL' && user.partnerId) {
          const partner = partners.find(pt => pt.id === user.partnerId);
          return partner?.partnerName || '';
        }
        const cid = user.companyId;
        if (!cid) return '';
        const comp = companies.find(c => c.id === cid);
        return comp?.companyName || '';
      },
    },
    {
      field: 'departmentId',
      headerName: '부서',
      width: 120,
      valueFormatter: (p) => {
        const deptId = p.value as number | null;
        if (!deptId) return '';
        const dept = departments.find(d => d.id === deptId);
        return dept?.deptName || '';
      },
    },
    {
      field: 'positionId',
      headerName: '직급',
      width: 100,
      valueFormatter: (p) => {
        const posId = p.value as number | null;
        if (!posId) return '';
        const pos = positions.find(pt => pt.id === posId);
        return pos?.positionName || '';
      },
    },
    { field: 'email', headerName: '이메일', width: 180 },
    { field: 'employeeNumber', headerName: '사번', width: 100 },
    {
      field: 'enabled',
      headerName: '상태',
      width: 80,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      valueFormatter: (p) => p.value ? '활성' : '비활성',
    },
    {
      colId: 'actions',
      headerName: '관리',
      width: 220,
      cellRenderer: (p: { data: User }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(p.data);
            }}
          >
            수정
          </button>
          {perm.canViewPii && (
            <button
              className="mes-btn"
              style={{ fontSize: 11, padding: '2px 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewPii(p.data);
              }}
            >
              PII
            </button>
          )}
          {perm.canUpdate && (
            <button
              className="mes-btn"
              style={{ fontSize: 11, padding: '2px 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleResetPassword(p.data);
              }}
            >
              PW초기화
            </button>
          )}
        </div>
      ),
    },
  ], [departments, positions, companies, partners, handleEdit, handleViewPii, handleResetPassword, perm.canUpdate, perm.canViewPii]);

  const extraParams = useMemo(() => {
    if (userTypeFilter) return { userType: userTypeFilter };
    return undefined;
  }, [userTypeFilter]);

  return (
    <div>
      <PeakDataGrid<User>
        toolbarLeft={
          <>
            <PageTitle />
            {perm.canCreate && (
              <button
                className="mes-btn mes-btn-new"
                onClick={handleCreate}
              >
                신규 등록
              </button>
            )}
            <select
              value={userTypeFilter}
              onChange={e => setUserTypeFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">전체</option>
              <option value="INTERNAL">내부직원</option>
              <option value="EXTERNAL">외부직원</option>
            </select>
          </>
        }
        columns={columns}
        queryKey={['system-users', userTypeFilter]}
        queryUrl="/system/users"
        extraParams={extraParams}
        enableSearch
        refetchTrigger={refetchTrigger}
      />

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={selectedUser ? '사용자 수정' : '사용자 등록'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          {/* User Type */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              사용자유형
            </label>
            <select
              value={form.userType}
              onChange={(e) => setForm(prev => ({
                ...prev,
                userType: e.target.value,
                partnerId: null,
                departmentId: null,
                positionId: null,
                roleName: '',
              }))}
              style={selectStyle}
            >
              <option value="INTERNAL">내부직원</option>
              <option value="EXTERNAL">외부직원</option>
            </select>
          </div>

          <FormField
            label="사용자ID"
            required
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={selectedUser !== null}
            placeholder="사용자ID를 입력하세요"
            error={errors.username}
          />
          <FormField
            label="비밀번호"
            required={selectedUser === null}
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={selectedUser ? '변경 시에만 입력' : '비밀번호를 입력하세요'}
            error={errors.password}
          />
          <FormField
            label="비밀번호 확인"
            required={selectedUser === null || !!form.password}
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.passwordConfirm || (form.passwordConfirm && form.password !== form.passwordConfirm ? '비밀번호가 일치하지 않습니다' : undefined)}
          />
          <p style={{ gridColumn: '1 / -1', fontSize: 11, color: '#6b7280', margin: '-8px 0 12px', lineHeight: 1.5 }}>
            12자 이상, 대문자/소문자/숫자/특수문자 각 1개 이상 포함, 연속 문자 4자 이상 불가
          </p>
          <FormField
            label="이름"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="이름을 입력하세요"
            error={errors.name}
          />
          <FormField
            label="이메일"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="이메일을 입력하세요"
          />
          <FormField
            label="사번"
            value={form.employeeNumber}
            onChange={(e) => handleChange('employeeNumber', e.target.value)}
            placeholder="사번을 입력하세요"
          />

          {/* Role select */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              역할
              <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
            </label>
            <select
              value={form.roleName}
              onChange={(e) => setForm(prev => ({ ...prev, roleName: e.target.value }))}
              style={selectStyle}
            >
              <option value="">선택 안함</option>
              {roles.map(r => (
                <option key={r.id} value={r.roleCode}>{r.roleCode} ({r.roleName})</option>
              ))}
            </select>
          </div>

          {/* Company select (both types) */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              소속회사
            </label>
            <select
              value={form.companyId ?? ''}
              onChange={(e) => setForm(prev => ({ ...prev, companyId: e.target.value ? Number(e.target.value) : null }))}
              style={selectStyle}
            >
              <option value="">선택 안함</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {form.userType === 'INTERNAL' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>부서</label>
                <select
                  value={form.departmentId ?? ''}
                  onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value ? Number(e.target.value) : null }))}
                  style={selectStyle}
                >
                  <option value="">선택 안함</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.deptName}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>직급</label>
                <select
                  value={form.positionId ?? ''}
                  onChange={(e) => handlePositionChange(e.target.value ? Number(e.target.value) : null)}
                  style={selectStyle}
                >
                  <option value="">선택 안함</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.positionName}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {form.userType === 'EXTERNAL' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                소속거래처
              </label>
              <select
                value={form.partnerId ?? ''}
                onChange={(e) => setForm(prev => ({ ...prev, partnerId: e.target.value ? Number(e.target.value) : null }))}
                style={selectStyle}
              >
                <option value="">선택 안함</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.partnerName} ({p.partnerCode})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={handleClose}
            style={{
              padding: '6px 16px', border: '1px solid #d1d5db',
              borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14,
            }}
          >
            취소
          </button>
          {(selectedUser ? perm.canUpdate : perm.canCreate) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mes-btn mes-btn-save" style={{ padding: '6px 16px', fontSize: 14, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </Modal>

      <Modal open={piiModalOpen} onClose={() => setPiiModalOpen(false)} title="개인정보 상세">
        {piiData && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: 14 }}>
            <span style={{ fontWeight: 500, color: '#374151' }}>이름</span><span>{String(piiData.name ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>이메일</span><span>{String(piiData.email ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>전화번호</span><span>{String(piiData.phoneNumber ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>생년월일</span><span>{String(piiData.birthday ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>우편번호</span><span>{String(piiData.postalCode ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>기본주소</span><span>{String(piiData.addressBase ?? '-')}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>상세주소</span><span>{String(piiData.addressDetail ?? '-')}</span>
          </div>
        )}
      </Modal>
      <ConfirmDialog />
    </div>
  );
}
