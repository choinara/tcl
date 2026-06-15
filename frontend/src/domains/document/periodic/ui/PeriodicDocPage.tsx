import { useState, useCallback, useEffect } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface Template {
  id: number;
  title: string;
  periodType: string;
  dueDay: number | null;
}

interface Instance {
  id: number;
  templateId: number;
  periodLabel: string;
  status: string;
  dueDate: string;
  completedAt: string;
  approvedAt: string;
  assigneeId: number | null;
  approverId: number | null;
  remark: string;
}

interface Dashboard {
  NOT_STARTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  APPROVED: number;
  OVERDUE: number;
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: '미착수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  APPROVED: '승인',
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  APPROVED: '#8b5cf6',
};

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: '주간', MONTHLY: '월간', QUARTERLY: '분기',
  SEMI_ANNUAL: '반기', YEARLY: '연간', MANUAL: '수시',
};

export default function PeriodicDocPage() {
  const perm = usePermission('DOC0060');
  const { notify } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [editInstance, setEditInstance] = useState<Partial<Instance> | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authFetch('/api/dms/documents/templates');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTemplates(json.data || []);
    } catch {
      notify('양식 목록 조회 실패', { type: 'error' });
    }
  }, [notify]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await authFetch('/api/dms/instances/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDashboard(json.data);
    } catch { notify('문서 유형 조회에 실패했습니다', { type: 'error' }); }
  }, [notify]);

  const fetchInstances = useCallback(async (templateId: number) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/dms/instances?templateId=${templateId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setInstances(json.data || []);
    } catch {
      notify('인스턴스 목록 조회 실패', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchTemplates(); fetchDashboard(); }, [fetchTemplates, fetchDashboard]);

  const handleSelectTemplate = useCallback((t: Template) => {
    setSelectedTemplate(t);
    setEditInstance(null);
    fetchInstances(t.id);
  }, [fetchInstances]);

  const handleSaveInstance = useCallback(async () => {
    if (!editInstance || !selectedTemplate) return;
    try {
      let res;
      if (editInstance.id) {
        res = await authFetch(`/api/dms/instances/${editInstance.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editInstance),
        });
      } else {
        res = await authFetch('/api/dms/instances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editInstance, templateId: selectedTemplate.id }),
        });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify(editInstance.id ? '수정되었습니다' : '등록되었습니다', { type: 'success' });
      setEditInstance(null);
      fetchInstances(selectedTemplate.id);
      fetchDashboard();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`저장 실패: ${msg}`, { type: 'error' });
    }
  }, [editInstance, selectedTemplate, notify, fetchInstances, fetchDashboard]);

  const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 };
  const headerCellStyle: React.CSSProperties = { ...cellStyle, background: '#f8fafc', fontWeight: 600, textAlign: 'left' };
  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '4px 12px', background: color, color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 4,
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      {/* Dashboard */}
      {dashboard && (
        <div style={{ display: 'flex', gap: 12, padding: '8px 16px', borderBottom: '1px solid #e2e8f0' }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={{
              padding: '8px 16px', borderRadius: 8, background: '#f8fafc', textAlign: 'center', minWidth: 80,
              border: `1px solid ${STATUS_COLORS[key]}20`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLORS[key] }}>{(dashboard as Record<string, number>)[key] ?? 0}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
            </div>
          ))}
          <div style={{
            padding: '8px 16px', borderRadius: 8, background: '#fef2f2', textAlign: 'center', minWidth: 80,
            border: '1px solid #fee2e220',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{dashboard.OVERDUE ?? 0}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>기한초과</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Template list */}
        <div style={{ width: 300, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13 }}>
            양식 목록
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {templates.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>등록된 양식이 없습니다</div>
            ) : templates.map(t => (
              <div key={t.id} onClick={() => handleSelectTemplate(t)}
                style={{
                  padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  background: selectedTemplate?.id === t.id ? '#eff6ff' : undefined,
                }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {PERIOD_LABELS[t.periodType] || t.periodType} {t.dueDay ? `/ ${t.dueDay}일` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Instances */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {editInstance ? (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                {editInstance.id ? '인스턴스 수정' : '인스턴스 등록'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 500 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>기간 라벨 *</label>
                  <input value={editInstance.periodLabel || ''} placeholder="예: 2026-03"
                    onChange={e => setEditInstance({ ...editInstance, periodLabel: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>상태</label>
                  <select value={editInstance.status || 'NOT_STARTED'}
                    onChange={e => setEditInstance({ ...editInstance, status: e.target.value })}
                    style={inputStyle}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>마감일</label>
                  <input type="date" value={editInstance.dueDate || ''}
                    onChange={e => setEditInstance({ ...editInstance, dueDate: e.target.value })}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>비고</label>
                  <textarea value={editInstance.remark || ''} rows={2}
                    onChange={e => setEditInstance({ ...editInstance, remark: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={handleSaveInstance} style={btnStyle('#3b82f6')}>저장</button>
                <button onClick={() => setEditInstance(null)} style={btnStyle('#6b7280')}>취소</button>
              </div>
            </div>
          ) : selectedTemplate ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                  {selectedTemplate.title} — 인스턴스
                </h3>
                {perm.canCreate && (
                  <button onClick={() => setEditInstance({ periodLabel: '', status: 'NOT_STARTED', dueDate: '', remark: '' })}
                    style={btnStyle('#10b981')}>+ 등록</button>
                )}
              </div>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
              ) : instances.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>등록된 인스턴스가 없습니다</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={headerCellStyle}>기간</th>
                      <th style={{ ...headerCellStyle, width: 80 }}>상태</th>
                      <th style={{ ...headerCellStyle, width: 100 }}>마감일</th>
                      <th style={{ ...headerCellStyle, width: 120 }}>완료일</th>
                      <th style={headerCellStyle}>비고</th>
                      <th style={{ ...headerCellStyle, width: 60 }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instances.map(inst => {
                      const isOverdue = inst.dueDate && !['COMPLETED', 'APPROVED'].includes(inst.status)
                        && new Date(inst.dueDate) < new Date();
                      return (
                        <tr key={inst.id} style={{ background: isOverdue ? '#fef2f2' : undefined }}>
                          <td style={cellStyle}>{inst.periodLabel}</td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                              color: STATUS_COLORS[inst.status] || '#64748b',
                              background: `${STATUS_COLORS[inst.status] || '#64748b'}15`,
                            }}>
                              {STATUS_LABELS[inst.status] || inst.status}
                            </span>
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center', ...(isOverdue ? { color: '#dc2626', fontWeight: 600 } : {}) }}>
                            {inst.dueDate || '-'}
                          </td>
                          <td style={{ ...cellStyle, fontSize: 12, color: '#64748b' }}>
                            {inst.completedAt?.slice(0, 16).replace('T', ' ') || '-'}
                          </td>
                          <td style={cellStyle}>{inst.remark || '-'}</td>
                          <td style={cellStyle}>
                            {perm.canUpdate && (
                              <button onClick={() => setEditInstance(inst)} style={btnStyle('#3b82f6')}>수정</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 14 }}>
              좌측에서 양식을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
