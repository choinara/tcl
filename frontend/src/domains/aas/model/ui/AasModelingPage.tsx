import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Folder, ChevronRight, ChevronDown, Server, Tag, Trash2, FileBox, RefreshCw, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { authFetch } from '@/lib/api';
import type {
  AASXFile, ParseSummary, ParsedShell, ParsedSubmodel, ParsedElement, ParsedData,
  ValidationResult, ValidationResponse,
} from '../../shared/types';

const API_BASE = '';

// ─── Inline styles (CSS variable based) ───
const tableHeaderStyle: React.CSSProperties = {
  background: 'var(--grid-header-bg, #f0f4f8)',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 'var(--grid-font-size, 13px)',
  fontWeight: 600,
  textAlign: 'left',
  padding: '8px 10px',
  color: 'var(--color-text-primary)',
};

const tableCellStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 'var(--grid-font-size, 13px)',
  color: 'var(--color-text-primary)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: 16,
};

const badgeStyle = (color: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; text: string }> = {
    red: { bg: '#fecaca', text: '#dc2626' },
    green: { bg: '#bbf7d0', text: '#16a34a' },
    blue: { bg: '#bfdbfe', text: '#2563eb' },
    yellow: { bg: '#fef08a', text: '#ca8a04' },
    gray: { bg: '#e5e7eb', text: '#6b7280' },
  };
  const c = colors[color] || colors.gray;
  return { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text };
};

// ─── Step Indicator ───
interface StepDef { num: number; label: string; icon: React.FC<{ className?: string }> }

const STEPS: StepDef[] = [
  { num: 1, label: 'AASX 업로드', icon: Upload },
  { num: 2, label: '메타데이터 확인', icon: Folder },
];

function StepIndicator({ steps, currentStep, maxStep, onGoTo }: {
  steps: StepDef[]; currentStep: number; maxStep: number; onGoTo: (n: number) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {steps.map((step) => {
        const Icon = step.icon;
        const active = step.num === currentStep;
        const reachable = step.num <= maxStep;
        return (
          <button
            key={step.num}
            onClick={() => reachable && onGoTo(step.num)}
            disabled={!reachable}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6, border: 'none',
              cursor: reachable ? 'pointer' : 'default',
              background: active ? 'var(--color-primary)' : 'var(--color-bg-hover, #e2e8f0)',
              color: active ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: active ? 700 : 500, fontSize: 13,
              opacity: reachable ? 1 : 0.4,
            }}
          >
            <Icon className="w-4 h-4" />
            <span>{step.num}. {step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Validation Report Modal ───
function ValidationReportModal({ open, onClose, data }: {
  open: boolean; onClose: () => void; data: ValidationResponse | null;
}) {
  if (!data) return null;
  const { file_name, results, summary } = data;
  const categories = ['기본사항', 'AAS', 'Submodel', 'SubmodelCollection', 'Property', 'ConceptDescription'];

  return (
    <Modal open={open} onClose={onClose} title="AAS 표준 준수 검증 결과" width={900}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{file_name}</span>
      </div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.total}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>총 항목</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', background: '#f0fdf4' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{summary.passed}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>통과</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', background: '#fef2f2' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{summary.failed}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>미통과</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: summary.pass_rate >= 80 ? '#16a34a' : summary.pass_rate >= 50 ? '#ca8a04' : '#dc2626' }}>
            {summary.pass_rate}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>준수율</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
          <span>필수 항목</span>
          <span><span style={{ color: '#16a34a' }}>{summary.mandatory_passed}</span> / {summary.mandatory_total}</span>
        </div>
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
          <span>옵션 항목</span>
          <span><span style={{ color: '#16a34a' }}>{summary.optional_passed}</span> / {summary.optional_total}</span>
        </div>
      </div>
      {/* Results by category */}
      {categories.map((cat) => {
        const catResults = results.filter((r: ValidationResult) => r.category === cat);
        if (catResults.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>{cat}</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: 40 }}>#</th>
                  <th style={{ ...tableHeaderStyle, width: 60 }}>중요도</th>
                  <th style={tableHeaderStyle}>체크항목</th>
                  <th style={{ ...tableHeaderStyle, width: 50 }}>결과</th>
                  <th style={tableHeaderStyle}>비고</th>
                </tr>
              </thead>
              <tbody>
                {catResults.map((r: ValidationResult) => (
                  <tr key={r.check_no} style={{ cursor: 'default' }}>
                    <td style={tableCellStyle}>{r.check_no}</td>
                    <td style={tableCellStyle}>
                      <span style={badgeStyle(r.importance === '필수' ? 'red' : 'gray')}>{r.importance}</span>
                    </td>
                    <td style={tableCellStyle} title={r.description}>{r.check_item}</td>
                    <td style={tableCellStyle}>
                      {r.is_passed ? <CheckCircle className="w-4 h-4" style={{ color: '#16a34a' }} /> : <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />}
                    </td>
                    <td style={{ ...tableCellStyle, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remarks}>
                      {r.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </Modal>
  );
}

// ─── Step 1: AASX Upload ───
function Step1({ onNext, onParsedData, perm }: { onNext: () => void; onParsedData: (d: ParsedData | null) => void; perm: { canCreate: boolean; canDelete: boolean } }) {
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [aasxList, setAasxList] = useState<AASXFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [tempFile, setTempFile] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAasx, setSelectedAasx] = useState<AASXFile | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [createAssetType, setCreateAssetType] = useState(true);
  const [createdAssetType, setCreatedAssetType] = useState<{ type_code: string; action: string } | null>(null);

  const fetchAasxList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/aas/aasx/list`);
      if (res.ok) setAasxList(await res.json());
    } catch (e) {
      console.error('AASX 목록 조회 실패:', e);
      notify('AASX 목록 조회 실패', { type: 'error' });
    }
    finally { setLoading(false); }
  }, [notify]);

  useEffect(() => { fetchAasxList(); }, [fetchAasxList]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.aasx')) { setError('AASX 파일만 업로드 가능합니다.'); return; }
    setSelectedAasx(null); setUploading(true); setError(null); setParseSummary(null); setTempFile(null); onParsedData(null);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await authFetch(`${API_BASE}/api/aas/aasx/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setParseSummary(data.summary); setTempFile(data.temp_file);
        if (data.parsed_data) onParsedData(data.parsed_data);
      } else { const errData = await res.json(); setError(errData.detail || '업로드 실패'); }
    } catch { setError('서버 연결 실패. API 서버가 실행 중인지 확인하세요.'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); };
  const handleClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); };

  const handleValidate = async () => {
    if (!tempFile) return;
    setValidating(true); setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/aas/aasx/validate?temp_file=${encodeURIComponent(tempFile)}`, { method: 'POST' });
      if (res.ok) { const data = await res.json(); setValidationResult(data); setShowValidationPopup(true); }
      else { const errData = await res.json(); setError(errData.detail || '검증 실패'); }
    } catch { setError('검증 실패. 서버 연결을 확인하세요.'); }
    finally { setValidating(false); }
  };

  const handleSaveAndNext = async () => {
    if (!tempFile) return;
    setUploading(true); setCreatedAssetType(null);
    try {
      const params = new URLSearchParams({ temp_file: tempFile, create_asset_type: String(createAssetType) });
      const res = await authFetch(`${API_BASE}/api/aas/aasx/save?${params}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        await fetchAasxList();
        if (result.asset_type) {
          setCreatedAssetType(result.asset_type);
          notify(`Asset Type '${result.asset_type.type_code}' ${result.asset_type.action === 'created' ? '생성됨' : '업데이트됨'}`, { type: 'success' });
          setTimeout(() => { setParseSummary(null); setTempFile(null); setCreateAssetType(false); setCreatedAssetType(null); onNext(); }, 1500);
        } else { setParseSummary(null); setTempFile(null); setCreateAssetType(false); onNext(); }
      } else { const errData = await res.json(); setError(errData.detail || '저장 실패'); }
    } catch { setError('저장 실패'); }
    finally { setUploading(false); }
  };

  const handleCancel = () => {
    setParseSummary(null); setTempFile(null); setValidationResult(null); setError(null); onParsedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: number, fileName: string) => {
    if (!await confirmDialog(`"${fileName}" 파일과 관련된 모든 DB 데이터를 삭제하시겠습니까?`)) return;
    setDeleting(id);
    try {
      const res = await authFetch(`${API_BASE}/api/aas/aasx/${id}`, { method: 'DELETE' });
      if (res.ok) { await fetchAasxList(); if (selectedAasx?.id === id) { setSelectedAasx(null); onParsedData(null); } }
      else { const errData = await res.json(); setError(errData.detail || '삭제 실패'); }
    } catch { setError('삭제 실패'); }
    finally { setDeleting(null); }
  };

  const handleSelectAasx = async (file: AASXFile) => {
    if (selectedAasx?.id === file.id) { setSelectedAasx(null); onParsedData(null); return; }
    setParseSummary(null); setTempFile(null); setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedAasx(file); setLoadingSelected(true); setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/aas/aasx/${file.id}/parsed`);
      if (res.ok) { const data = await res.json(); onParsedData(data.parsed_data); }
      else { const errData = await res.json(); setError(errData.detail || '파싱 데이터 조회 실패'); setSelectedAasx(null); }
    } catch { setError('서버 연결 실패'); setSelectedAasx(null); }
    finally { setLoadingSelected(false); }
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Left: AASX list */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileBox className="w-5 h-5" /> 등록된 AASX 파일
            </h3>
            <button onClick={fetchAasxList} className="mes-btn" title="새로고침" style={{ padding: '4px 8px' }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {loading && aasxList.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-disabled)' }}>로딩 중...</div>
          ) : aasxList.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-disabled)' }}>등록된 AASX 파일이 없습니다.</div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {aasxList.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectAasx(file)}
                  style={{
                    borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s',
                    background: selectedAasx?.id === file.id ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-bg-hover, #f8fafc)',
                    border: selectedAasx?.id === file.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {file.file_name}
                        {selectedAasx?.id === file.id && loadingSelected && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        버전: {file.aas_version || '-'} | Shell: {file.shell_count} | Submodel: {file.submodel_count} | Element: {file.element_count}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-disabled)', marginTop: 4 }}>{new Date(file.created_at).toLocaleString('ko-KR')}</div>
                    </div>
                    {perm.canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.file_name); }}
                        disabled={deleting === file.id}
                        className="mes-btn mes-btn-delete"
                        style={{ padding: '4px 8px', marginLeft: 8 }}
                        title="삭제"
                      >
                        <Trash2 className={`w-5 h-5 ${deleting === file.id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {selectedAasx && !parseSummary && (
            <button className="mes-btn mes-btn-search" onClick={() => onNext()} disabled={loadingSelected}>
              {loadingSelected ? '로딩 중...' : '다음'}
            </button>
          )}
        </div>
      </div>

      {/* Right: Upload */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>AASX 파일 업로드</h3>
          <input ref={fileInputRef} type="file" accept=".aasx" onChange={handleFileChange} style={{ display: 'none' }} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={handleClick}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer',
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: dragging ? 'color-mix(in srgb, var(--color-primary) 5%, transparent)' : 'transparent',
            }}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-10 h-10 animate-spin" style={{ color: 'var(--color-primary)', marginBottom: 12 }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>파싱 중...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10" style={{ color: 'var(--color-text-disabled)', marginBottom: 12 }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>AASX 파일을 드래그하거나 클릭하여 업로드</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-disabled)', marginTop: 8 }}>.aasx 파일만 지원</p>
              </>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 13 }}>{error}</div>
          )}

          {parseSummary && (
            <div style={{ marginTop: 12, padding: 14, background: 'var(--color-bg-hover, #f8fafc)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontWeight: 600 }}>파싱 결과 요약</h4>
                <button className="mes-btn mes-btn-search" onClick={handleValidate} disabled={validating} >
                  {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {validating ? '검증 중...' : 'AAS 표준 검증'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>파일명</span><span>{parseSummary.file_name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>AAS 버전</span><span>{parseSummary.aas_version}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>파일 해시</span><span style={{ fontFamily: 'monospace', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>{parseSummary.file_hash}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Shell</span><span>{parseSummary.shell_count}개</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Submodel</span><span>{parseSummary.submodel_count}개</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Element</span><span>{parseSummary.element_count}개</span>
              </div>
              {/* Asset Type auto-create option */}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={createAssetType} onChange={(e) => setCreateAssetType(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 13 }}>Asset Type으로 등록</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>(Shell 정보 기반으로 자동 생성)</span>
                </label>
                {createdAssetType && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle className="w-4 h-4" />
                    Asset Type '{createdAssetType.type_code}' {createdAssetType.action === 'created' ? '생성됨' : '업데이트됨'}
                  </div>
                )}
              </div>
              {validationResult && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>검증 결과</span>
                    <button onClick={() => setShowValidationPopup(true)} style={{ fontSize: 13, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>상세 보기</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><CheckCircle className="w-4 h-4" style={{ color: '#16a34a' }} />{validationResult.summary.passed} 통과</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />{validationResult.summary.failed} 미통과</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: validationResult.summary.pass_rate >= 80 ? '#16a34a' : validationResult.summary.pass_rate >= 50 ? '#ca8a04' : '#dc2626' }}>({validationResult.summary.pass_rate}%)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {parseSummary && <button className="mes-btn" onClick={handleCancel} disabled={uploading}>취소</button>}
          {perm.canCreate && (
            <button className="mes-btn mes-btn-save" onClick={handleSaveAndNext} disabled={!parseSummary || uploading}>
              {uploading ? '저장 중...' : '저장하고 다음'}
            </button>
          )}
        </div>
      </div>

      <ValidationReportModal open={showValidationPopup} onClose={() => setShowValidationPopup(false)} data={validationResult} />
      <ConfirmDialog />
    </div>
  );
}

// ─── Step 2: Metadata Tree ───
type TreeSelection =
  | { type: 'shell'; data: ParsedShell }
  | { type: 'submodel'; data: ParsedSubmodel }
  | { type: 'element'; data: ParsedElement };

function Step2({ parsedData }: { parsedData: ParsedData | null }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TreeSelection | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const Chevron = ({ id }: { id: string }) =>
    expanded.has(id) ? <ChevronDown className="w-4 h-4" style={{ flexShrink: 0 }} /> : <ChevronRight className="w-4 h-4" style={{ flexShrink: 0 }} />;

  if (!parsedData || parsedData.shells.length === 0) {
    return (
      <div style={{ display: 'flex', gap: 20, height: '100%' }}>
        <div style={{ ...cardStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <Folder className="w-16 h-16" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 16 }}>파싱된 AAS 데이터가 없습니다.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Step 1에서 AASX 파일을 업로드해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  const elementsBySubmodel = parsedData.elements.reduce((acc, elem) => {
    const key = elem.submodel_id_short;
    if (!acc[key]) acc[key] = [];
    acc[key].push(elem);
    return acc;
  }, {} as Record<string, ParsedElement[]>);

  const treeItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', width: '100%',
    textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, fontSize: 13,
    color: 'var(--color-text-primary)',
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%', minHeight: 0 }}>
      <div style={{ ...cardStyle, width: '50%', overflow: 'auto' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>AAS 구조 트리</h3>
        {parsedData.shells.map((shell) => {
          const shellKey = shell.id || shell.idShort;
          return (
            <div key={shellKey}>
              <button onClick={() => { toggle(shellKey); setSelected({ type: 'shell', data: shell }); }} style={treeItemStyle}>
                <Chevron id={shellKey} /><Server className="w-4 h-4" style={{ color: '#3b82f6' }} /><span>{shell.idShort}</span>
              </button>
              {expanded.has(shellKey) && parsedData.submodels.map((submodel) => {
                const smKey = submodel.id || submodel.idShort;
                const smElements = elementsBySubmodel[submodel.idShort] || [];
                return (
                  <div key={smKey} style={{ marginLeft: 24 }}>
                    <button onClick={() => { toggle(smKey); setSelected({ type: 'submodel', data: submodel }); }} style={treeItemStyle}>
                      <Chevron id={smKey} /><Folder className="w-4 h-4" style={{ color: '#eab308' }} /><span>{submodel.idShort}</span>
                      <span style={badgeStyle('blue')}>{smElements.length}</span>
                    </button>
                    {expanded.has(smKey) && smElements.slice(0, 50).map((elem, idx) => (
                      <button key={`${elem.element_path}-${idx}`} onClick={() => setSelected({ type: 'element', data: elem })}
                        style={{ ...treeItemStyle, marginLeft: 24, fontSize: 12 }}>
                        <Tag className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{elem.id_short}</span>
                        <span style={{ color: 'var(--color-text-disabled)', fontSize: 11 }}>{elem.element_type}</span>
                      </button>
                    ))}
                    {expanded.has(smKey) && smElements.length > 50 && (
                      <div style={{ marginLeft: 48, color: 'var(--color-text-disabled)', fontSize: 12, padding: 4 }}>... 외 {smElements.length - 50}개</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, flex: 1, overflow: 'auto' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>상세 정보</h3>
          {!selected && <p style={{ color: 'var(--color-text-disabled)' }}>좌측 트리에서 항목을 선택하세요</p>}

          {selected?.type === 'shell' && (
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 }}>
              <dt style={{ color: 'var(--color-text-secondary)' }}>AAS ID</dt><dd style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.data.id}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>ID Short</dt><dd>{selected.data.idShort}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Asset Kind</dt><dd>{selected.data.assetInformation?.assetKind || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Global Asset ID</dt><dd style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.data.assetInformation?.globalAssetId || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>설명</dt><dd>{selected.data.description?.find((d) => d.language === 'ko')?.text || selected.data.description?.find((d) => d.language === 'en')?.text || '-'}</dd>
            </dl>
          )}

          {selected?.type === 'submodel' && (
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 }}>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Submodel ID</dt><dd style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.data.id}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>ID Short</dt><dd>{selected.data.idShort}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Semantic ID</dt><dd style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.data.semanticId?.keys?.[0]?.value || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Element 수</dt><dd>{elementsBySubmodel[selected.data.idShort]?.length || 0}개</dd>
            </dl>
          )}

          {selected?.type === 'element' && (
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 }}>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Type</dt><dd><span style={badgeStyle('blue')}>{selected.data.element_type}</span></dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>ID Short</dt><dd>{selected.data.id_short}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Path</dt><dd style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.data.element_path}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Value Type</dt><dd>{selected.data.value_type || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Value</dt><dd>{String(selected.data.value ?? '-')}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Unit</dt><dd>{selected.data.unit || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>Semantic ID</dt><dd style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.data.semantic_id || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>설명 (KO)</dt><dd>{selected.data.description_ko || '-'}</dd>
              <dt style={{ color: 'var(--color-text-secondary)' }}>설명 (EN)</dt><dd>{selected.data.description_en || '-'}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ───
export default function AasModelingPage() {
  const perm = usePermission('AA0010');
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const goTo = (step: number) => { if (step <= maxStep) setCurrentStep(step); };
  const nextStep = () => { const next = currentStep + 1; setMaxStep((prev) => Math.max(prev, next)); setCurrentStep(next); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageTitle />
      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StepIndicator steps={STEPS} currentStep={currentStep} maxStep={maxStep} onGoTo={goTo} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {currentStep === 1 && <Step1 onNext={nextStep} onParsedData={setParsedData} perm={perm} />}
          {currentStep === 2 && <Step2 parsedData={parsedData} />}
        </div>
      </div>
    </div>
  );
}
