import { useState, useCallback, useEffect } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface FavoriteLine {
  id: number;
  lineName: string;
  lineData: string;
  createdAt: string;
}

interface OrgUser {
  id: number;
  name: string;
  positionName: string;
  departmentName: string;
}

export default function ApprovalLinePage() {
  const perm = usePermission('EA0030');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const [lines, setLines] = useState<FavoriteLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<FavoriteLine | null>(null);

  // 결재선 작성
  const [lineName, setLineName] = useState('');
  const [steps, setSteps] = useState<{ order: number; userId: number; userName: string; positionName: string }[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<OrgUser[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchLines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/approval/lines/favorites');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLines(Array.isArray(data) ? data : []);
    } catch {
      notify('결재선 목록 조회 실패', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchLines(); }, [fetchLines]);

  const searchUsers = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    try {
      const res = await authFetch(`/api/approval/lines/organization/users?keyword=${encodeURIComponent(searchKeyword)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      notify('사용자 검색 실패', { type: 'error' });
    }
  }, [searchKeyword, notify]);

  const addStep = useCallback((user: OrgUser) => {
    setSteps(prev => [...prev, {
      order: prev.length + 1,
      userId: user.id,
      userName: user.name,
      positionName: user.positionName,
    }]);
  }, []);

  const removeStep = useCallback((order: number) => {
    setSteps(prev => prev.filter(s => s.order !== order).map((s, i) => ({ ...s, order: i + 1 })));
  }, []);

  const handleSave = useCallback(async () => {
    if (!lineName.trim()) { notify('결재선 이름을 입력하세요', { type: 'error' }); return; }
    if (steps.length === 0) { notify('결재 단계를 추가하세요', { type: 'error' }); return; }
    try {
      const res = await authFetch('/api/approval/lines/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineName,
          lineData: JSON.stringify(steps),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify('결재선이 저장되었습니다', { type: 'success' });
      setShowForm(false);
      setLineName('');
      setSteps([]);
      fetchLines();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`저장 실패: ${msg}`, { type: 'error' });
    }
  }, [lineName, steps, notify, fetchLines]);

  const handleDelete = useCallback(async (id: number) => {
    if (!await confirmDialog('결재선을 삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/approval/lines/favorites/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify('삭제되었습니다', { type: 'success' });
      if (selectedLine?.id === id) setSelectedLine(null);
      fetchLines();
    } catch {
      notify('삭제 실패', { type: 'error' });
    }
  }, [selectedLine, notify, fetchLines, confirmDialog]);

  const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 };
  const headerStyle: React.CSSProperties = { ...cellStyle, background: '#f8fafc', fontWeight: 600, textAlign: 'left' };
  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '4px 12px', background: color, color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 4,
  });

  const parseLineData = (data: string): { order: number; userName: string; positionName: string }[] => {
    try { return JSON.parse(data); } catch { return []; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Line list */}
        <div style={{ width: 400, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
            {perm.canCreate && (
              <button onClick={() => { setShowForm(true); setSelectedLine(null); setLineName(''); setSteps([]); }}
                style={btnStyle('#10b981')}>+ 결재선 등록</button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
            ) : lines.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>등록된 결재선이 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={headerStyle}>결재선명</th><th style={{ ...headerStyle, width: 80 }}>단계수</th><th style={{ ...headerStyle, width: 80 }}>작업</th></tr></thead>
                <tbody>
                  {lines.map(l => (
                    <tr key={l.id} onClick={() => { setSelectedLine(l); setShowForm(false); }}
                      style={{ cursor: 'pointer', background: selectedLine?.id === l.id ? '#eff6ff' : undefined }}>
                      <td style={cellStyle}>{l.lineName}</td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>{parseLineData(l.lineData).length}</td>
                      <td style={cellStyle}>{perm.canDelete && <button onClick={e => { e.stopPropagation(); handleDelete(l.id); }} style={btnStyle('#ef4444')}>삭제</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Detail or Form */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {showForm ? (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>결재선 등록</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>결재선명</label>
                <input value={lineName} onChange={e => setLineName(e.target.value)}
                  style={{ width: '100%', maxWidth: 300, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }} />
              </div>

              {/* Steps */}
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>결재 단계</h4>
              {steps.length === 0 ? (
                <div style={{ padding: 12, color: '#94a3b8', fontSize: 13 }}>아래에서 결재자를 검색하여 추가하세요</div>
              ) : (
                <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead><tr><th style={headerStyle}>순서</th><th style={headerStyle}>이름</th><th style={headerStyle}>직급</th><th style={{ ...headerStyle, width: 60 }}>삭제</th></tr></thead>
                  <tbody>
                    {steps.map(s => (
                      <tr key={s.order}>
                        <td style={{ ...cellStyle, width: 50, textAlign: 'center' }}>{s.order}</td>
                        <td style={cellStyle}>{s.userName}</td>
                        <td style={cellStyle}>{s.positionName}</td>
                        <td style={cellStyle}><button onClick={() => removeStep(s.order)} style={btnStyle('#ef4444')}>X</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* User search */}
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <input value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                  placeholder="결재자 이름 검색" onKeyDown={e => e.key === 'Enter' && searchUsers()}
                  style={{ width: 200, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }} />
                <button onClick={searchUsers} style={btnStyle('#3b82f6')}>검색</button>
              </div>
              {searchResults.length > 0 && (
                <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse', marginBottom: 12 }}>
                  <tbody>
                    {searchResults.map(u => (
                      <tr key={u.id}>
                        <td style={cellStyle}>{u.name}</td>
                        <td style={cellStyle}>{u.positionName}</td>
                        <td style={cellStyle}>{u.departmentName}</td>
                        <td style={{ ...cellStyle, width: 60 }}><button onClick={() => addStep(u)} style={btnStyle('#10b981')}>추가</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {perm.canCreate && <button onClick={handleSave} style={btnStyle('#3b82f6')}>저장</button>}
                <button onClick={() => setShowForm(false)} style={btnStyle('#6b7280')}>취소</button>
              </div>
            </div>
          ) : selectedLine ? (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{selectedLine.lineName}</h3>
              <table style={{ width: '100%', maxWidth: 500, borderCollapse: 'collapse' }}>
                <thead><tr><th style={headerStyle}>순서</th><th style={headerStyle}>이름</th><th style={headerStyle}>직급</th></tr></thead>
                <tbody>
                  {parseLineData(selectedLine.lineData).map((s, i) => (
                    <tr key={i}>
                      <td style={{ ...cellStyle, width: 50, textAlign: 'center' }}>{s.order || i + 1}</td>
                      <td style={cellStyle}>{s.userName}</td>
                      <td style={cellStyle}>{s.positionName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 14 }}>
              좌측에서 결재선을 선택하거나 새로 등록하세요
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}
