import { useState, useCallback, useRef, useEffect } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export interface DocRow {
  id?: number;
  docNumber: string;
  title: string;
  description: string;
  productId: number | null;
  equipmentId: number | null;
  departmentId: number | null;
  version: string;
  status: string;
  tags: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  isTemplate: boolean;
  periodType: string;
  dueDay: number | null;
  assigneeId: number | null;
  createdBy: string;
  createdAt: string;
}

interface DocFileRow {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  version: string;
  revisionNote: string;
  uploadedBy: string;
  createdAt: string;
}

interface Props {
  category: string;
  menuCode: string;
  pageTitle: string;
  showCertFields?: boolean;
  showTemplateFields?: boolean;
}

export default function DocumentPage({ category, menuCode, pageTitle, showCertFields = false, showTemplateFields = false }: Props) {
  const perm = usePermission(menuCode);
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocRow | null>(null);
  const [files, setFiles] = useState<DocFileRow[]>([]);
  const [editDoc, setEditDoc] = useState<Partial<DocRow> | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (keyword) params.append('keyword', keyword);
      const res = await authFetch(`/api/dms/documents?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDocs(json.data || []);
    } catch {
      notify('문서 목록 조회 실패', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [category, keyword, notify]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const fetchFiles = useCallback(async (docId: number) => {
    try {
      const res = await authFetch(`/api/dms/documents/${docId}/files`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFiles(json.data || []);
    } catch {
      // 첨부파일 목록 조회 실패 — 빈 목록으로 폴백, 문서 상세보기에는 영향 없음
      setFiles([]);
    }
  }, []);

  const handleSelectDoc = useCallback((doc: DocRow) => {
    setSelectedDoc(doc);
    setEditDoc(null);
    if (doc.id) fetchFiles(doc.id);
  }, [fetchFiles]);

  const handleSaveDoc = useCallback(async () => {
    if (!editDoc) return;
    try {
      const body = { ...editDoc, category };
      let res;
      if (editDoc.id) {
        res = await authFetch(`/api/dms/documents/${editDoc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await authFetch('/api/dms/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify(editDoc.id ? '문서가 수정되었습니다' : '문서가 등록되었습니다', { type: 'success' });
      setEditDoc(null);
      fetchDocs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`저장 실패: ${msg}`, { type: 'error' });
    }
  }, [editDoc, category, notify, fetchDocs]);

  const handleDeleteDoc = useCallback(async (id: number) => {
    if (!await confirmDialog('문서를 삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/dms/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify('삭제되었습니다', { type: 'success' });
      setSelectedDoc(null);
      setFiles([]);
      fetchDocs();
    } catch {
      notify('삭제 실패', { type: 'error' });
    }
  }, [notify, fetchDocs, confirmDialog]);

  const handleUploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDoc?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`/api/dms/documents/${selectedDoc.id}/files`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify('파일이 업로드되었습니다', { type: 'success' });
      fetchFiles(selectedDoc.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`업로드 실패: ${msg}`, { type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [selectedDoc, notify, fetchFiles]);

  const handleDownloadFile = useCallback(async (fileId: number, fileName: string) => {
    try {
      const res = await authFetch(`/api/dms/documents/files/${fileId}/download`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify('다운로드 실패', { type: 'error' });
    }
  }, [notify]);

  const handleDeleteFile = useCallback(async (fileId: number) => {
    if (!await confirmDialog('파일을 삭제하시겠습니까?')) return;
    try {
      const res = await authFetch(`/api/dms/documents/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify('파일이 삭제되었습니다', { type: 'success' });
      if (selectedDoc?.id) fetchFiles(selectedDoc.id);
    } catch {
      notify('파일 삭제 실패', { type: 'error' });
    }
  }, [selectedDoc, notify, fetchFiles, confirmDialog]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / 1024 / 1024).toFixed(1) + 'MB';
  };

  const getValidityStyle = (validUntil: string | undefined): React.CSSProperties => {
    if (!validUntil) return {};
    const daysLeft = Math.floor((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { color: '#dc2626', fontWeight: 600 };
    if (daysLeft <= 30) return { color: '#ca8a04', fontWeight: 600 };
    return {};
  };

  const emptyForm: Partial<DocRow> = {
    docNumber: '', title: '', description: '', version: '1.0', status: 'ACTIVE', tags: '',
    issuer: '', validFrom: '', validUntil: '', isTemplate: false, periodType: '', dueDay: null, assigneeId: null,
  };

  const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 };
  const headerCellStyle: React.CSSProperties = { ...cellStyle, background: '#f8fafc', fontWeight: 600, textAlign: 'left' };
  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    padding: '4px 12px', background: disabled ? '#94a3b8' : color, color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', marginRight: 4,
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle label={pageTitle} />
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Document list */}
        <div style={{ width: 520, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="제목 검색" onKeyDown={e => e.key === 'Enter' && fetchDocs()}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }} />
            <button onClick={fetchDocs} style={btnStyle('#3b82f6')}>검색</button>
            {perm.canCreate && (
              <button onClick={() => { setEditDoc({ ...emptyForm }); setSelectedDoc(null); }}
                style={btnStyle('#10b981')}>+ 등록</button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
            ) : docs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>등록된 문서가 없습니다</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>문서번호</th>
                    <th style={headerCellStyle}>제목</th>
                    <th style={{ ...headerCellStyle, width: 60 }}>버전</th>
                    <th style={{ ...headerCellStyle, width: 70 }}>상태</th>
                    {showCertFields && <th style={{ ...headerCellStyle, width: 90 }}>유효기간</th>}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id} onClick={() => handleSelectDoc(doc)}
                      style={{ cursor: 'pointer', background: selectedDoc?.id === doc.id ? '#eff6ff' : undefined }}>
                      <td style={{ ...cellStyle, width: 110 }}>{doc.docNumber || '-'}</td>
                      <td style={cellStyle}>{doc.title}</td>
                      <td style={{ ...cellStyle, width: 60, textAlign: 'center' }}>{doc.version}</td>
                      <td style={{ ...cellStyle, width: 70, textAlign: 'center' }}>
                        {({ ACTIVE: '활성', ARCHIVED: '보관', EXPIRED: '만료' } as Record<string,string>)[doc.status] || doc.status}
                      </td>
                      {showCertFields && (
                        <td style={{ ...cellStyle, width: 90, textAlign: 'center', ...getValidityStyle(doc.validUntil) }}>
                          {doc.validUntil || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Detail + Files */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {editDoc ? (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{editDoc.id ? '문서 수정' : '문서 등록'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 600 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>문서번호</label>
                  <input value={editDoc.docNumber || ''} onChange={e => setEditDoc({ ...editDoc, docNumber: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>버전</label>
                  <input value={editDoc.version || ''} onChange={e => setEditDoc({ ...editDoc, version: e.target.value })}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>제목 *</label>
                  <input value={editDoc.title || ''} onChange={e => setEditDoc({ ...editDoc, title: e.target.value })}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>설명</label>
                  <textarea value={editDoc.description || ''} onChange={e => setEditDoc({ ...editDoc, description: e.target.value })}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>상태</label>
                  <select value={editDoc.status || 'ACTIVE'} onChange={e => setEditDoc({ ...editDoc, status: e.target.value })}
                    style={inputStyle}>
                    <option value="ACTIVE">활성</option>
                    <option value="ARCHIVED">보관</option>
                    <option value="EXPIRED">만료</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>태그</label>
                  <input value={editDoc.tags || ''} onChange={e => setEditDoc({ ...editDoc, tags: e.target.value })}
                    placeholder="쉼표로 구분" style={inputStyle} />
                </div>

                {showCertFields && (
                  <>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>발행처</label>
                      <input value={editDoc.issuer || ''} onChange={e => setEditDoc({ ...editDoc, issuer: e.target.value })}
                        style={inputStyle} />
                    </div>
                    <div />
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>유효기간 시작</label>
                      <input type="date" value={editDoc.validFrom || ''} onChange={e => setEditDoc({ ...editDoc, validFrom: e.target.value })}
                        style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>유효기간 종료</label>
                      <input type="date" value={editDoc.validUntil || ''} onChange={e => setEditDoc({ ...editDoc, validUntil: e.target.value })}
                        style={inputStyle} />
                    </div>
                  </>
                )}

                {showTemplateFields && (
                  <>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>주기</label>
                      <select value={editDoc.periodType || ''} onChange={e => setEditDoc({ ...editDoc, periodType: e.target.value })}
                        style={inputStyle}>
                        <option value="">선택</option>
                        <option value="WEEKLY">주간</option>
                        <option value="MONTHLY">월간</option>
                        <option value="QUARTERLY">분기</option>
                        <option value="SEMI_ANNUAL">반기</option>
                        <option value="YEARLY">연간</option>
                        <option value="MANUAL">수시</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>마감 기준일</label>
                      <input type="number" value={editDoc.dueDay ?? ''} onChange={e => setEditDoc({ ...editDoc, dueDay: e.target.value ? Number(e.target.value) : null })}
                        style={inputStyle} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={handleSaveDoc} style={btnStyle('#3b82f6')}>저장</button>
                <button onClick={() => setEditDoc(null)} style={btnStyle('#6b7280')}>취소</button>
              </div>
            </div>
          ) : selectedDoc ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selectedDoc.title}</h3>
                <div>
                  {perm.canUpdate && (
                    <button onClick={() => setEditDoc(selectedDoc)} style={btnStyle('#3b82f6')}>수정</button>
                  )}
                  {perm.canDelete && (
                    <button onClick={() => selectedDoc.id && handleDeleteDoc(selectedDoc.id)} style={btnStyle('#ef4444')}>삭제</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: 13, marginBottom: 20 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>문서번호</span><span>{selectedDoc.docNumber || '-'}</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>버전</span><span>{selectedDoc.version}</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>상태</span>
                <span>{({ ACTIVE: '활성', ARCHIVED: '보관', EXPIRED: '만료' } as Record<string,string>)[selectedDoc.status] || selectedDoc.status}</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>태그</span><span>{selectedDoc.tags || '-'}</span>
                {showCertFields && (
                  <>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>발행처</span><span>{selectedDoc.issuer || '-'}</span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>유효기간</span>
                    <span style={getValidityStyle(selectedDoc.validUntil)}>
                      {selectedDoc.validFrom && selectedDoc.validUntil ? `${selectedDoc.validFrom} ~ ${selectedDoc.validUntil}` : '-'}
                    </span>
                  </>
                )}
                {showTemplateFields && (
                  <>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>주기</span>
                    <span>{({ WEEKLY: '주간', MONTHLY: '월간', QUARTERLY: '분기', SEMI_ANNUAL: '반기', YEARLY: '연간', MANUAL: '수시' } as Record<string,string>)[selectedDoc.periodType] || selectedDoc.periodType || '-'}</span>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>마감 기준일</span>
                    <span>{selectedDoc.dueDay ?? '-'}</span>
                  </>
                )}
                <span style={{ color: '#64748b', fontWeight: 600 }}>설명</span><span>{selectedDoc.description || '-'}</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>등록자</span><span>{selectedDoc.createdBy || '-'}</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>등록일</span><span>{selectedDoc.createdAt?.slice(0, 16).replace('T', ' ') || '-'}</span>
              </div>

              {/* File section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>첨부파일</h4>
                  {perm.canCreate && (
                    <div>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleUploadFile} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        style={btnStyle('#10b981', uploading)}>
                        {uploading ? '업로드 중...' : '+ 파일 업로드'}
                      </button>
                    </div>
                  )}
                </div>
                {files.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>첨부파일이 없습니다</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>파일명</th>
                        <th style={{ ...headerCellStyle, width: 80 }}>크기</th>
                        <th style={{ ...headerCellStyle, width: 60 }}>버전</th>
                        <th style={{ ...headerCellStyle, width: 120 }}>업로드일</th>
                        <th style={{ ...headerCellStyle, width: 100 }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map(f => (
                        <tr key={f.id}>
                          <td style={cellStyle}>{f.fileName}</td>
                          <td style={{ ...cellStyle, textAlign: 'right' }}>{formatFileSize(f.fileSize)}</td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>{f.version}</td>
                          <td style={{ ...cellStyle, fontSize: 12, color: '#64748b' }}>{f.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                          <td style={cellStyle}>
                            <button onClick={() => handleDownloadFile(f.id, f.fileName)} style={btnStyle('#3b82f6')}>다운</button>
                            {perm.canDelete && (
                              <button onClick={() => handleDeleteFile(f.id)} style={btnStyle('#ef4444')}>삭제</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 14 }}>
              좌측에서 문서를 선택하거나 새 문서를 등록하세요
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}
