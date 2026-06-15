import { useState, useCallback, useEffect } from 'react';
import { authFetch } from '@/lib/api';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface DocItem {
  id: number;
  documentNumber: string;
  title: string;
  templateName: string;
  drafterName: string;
  status: string;
  urgency: string;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 'pending' | 'approved' | 'rejected' | 'drafted';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'pending', label: '진행중', color: '#f59e0b' },
  { key: 'drafted', label: '임시저장', color: '#6b7280' },
  { key: 'approved', label: '승인', color: '#10b981' },
  { key: 'rejected', label: '반려', color: '#ef4444' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '임시저장',
  SUBMITTED: '진행중',
  IN_PROGRESS: '진행중',
  APPROVED: '승인',
  REJECTED: '반려',
  WITHDRAWN: '회수',
};

export default function ApprovalStatusPage() {
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchDocs = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/approval/inbox/${tab}?page=0&size=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(data.content || []);
    } catch {
      notify('결재 현황 조회에 실패했습니다', { type: 'error' });
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await authFetch('/api/approval/inbox/pending/count');
      if (!res.ok) return;
      const data = await res.json();
      setPendingCount(data.count || 0);
    } catch { notify('결재 현황 조회에 실패했습니다', { type: 'error' }); }
  }, [notify]);

  useEffect(() => { fetchDocs(activeTab); }, [activeTab, fetchDocs]);
  useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);

  const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 };
  const headerStyle: React.CSSProperties = { ...cellStyle, background: '#f8fafc', fontWeight: 600, textAlign: 'left' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      {/* Summary */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ padding: '8px 16px', background: '#fef3c7', borderRadius: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>결재 대기: </span>
          <span style={{ color: '#d97706', fontWeight: 700 }}>{pendingCount}건</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px', border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === tab.key ? '#fff' : '#f8fafc',
              color: activeTab === tab.key ? tab.color : '#64748b',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>해당 문서가 없습니다</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle}>문서번호</th>
                <th style={headerStyle}>제목</th>
                <th style={headerStyle}>양식</th>
                <th style={headerStyle}>기안자</th>
                <th style={{ ...headerStyle, width: 80 }}>상태</th>
                <th style={{ ...headerStyle, width: 80 }}>긴급</th>
                <th style={{ ...headerStyle, width: 140 }}>기안일</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} style={{ cursor: 'pointer' }}
                  onClick={() => window.location.href = `/approval/${d.id}`}>
                  <td style={cellStyle}>{d.documentNumber || '-'}</td>
                  <td style={cellStyle}>{d.title}</td>
                  <td style={cellStyle}>{d.templateName || '-'}</td>
                  <td style={cellStyle}>{d.drafterName}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: d.status === 'APPROVED' ? '#dcfce7' : d.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color: d.status === 'APPROVED' ? '#166534' : d.status === 'REJECTED' ? '#991b1b' : '#92400e',
                    }}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: d.urgency === 'URGENT' ? '#ef4444' : '#64748b' }}>
                    {d.urgency === 'URGENT' ? '긴급' : d.urgency === 'HIGH' ? '높음' : '-'}
                  </td>
                  <td style={{ ...cellStyle, fontSize: 12, color: '#64748b' }}>
                    {d.createdAt?.slice(0, 16).replace('T', ' ') || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
