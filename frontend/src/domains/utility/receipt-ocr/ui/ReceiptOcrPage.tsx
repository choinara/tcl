import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ColDef } from 'ag-grid-community';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { exportReceiptExcel, type ReceiptRow, type ReceiptMeta } from '../receiptExcelExport';
import {
  type GridRow,
  type UploadedFile,
  RECEIPT_TYPES,
  TYPE_SHORT_LABELS,
  LABEL_TO_TYPE,
  generateId,
  extractDate,
  extractTime,
  toGridRow,
  currentYearMonth,
  loadPinnedValues,
  savePinnedValues,
} from '../receiptConstants';

interface OcrResult {
  supplier?: { name?: string };
  transaction_date?: string;
  items?: { part_name?: string; amount?: number; remarks?: string }[];
  summary?: { total?: number };
  handwritten_notes?: string;
}

export default function ReceiptOcrPage() {
  const perm = usePermission('UT0010');
  const { notify } = useToast();
  const gridRef = useRef<PeakEditGridRef>(null);

  // ── 고정 체크박스 상태 + 값 복원 ──
  const pinned = useMemo(() => loadPinnedValues(), []);

  // Meta info
  const [programName, setProgramName] = useState(pinned.programName ?? '');
  const [shootingDate, setShootingDate] = useState(pinned.shootingDate ?? currentYearMonth());
  const [pdName, setPdName] = useState(pinned.pdName ?? '');
  const [userName, setUserName] = useState('');
  const [receiptType, setReceiptType] = useState('travel');

  // 고정 체크박스
  const [pinProgramName, setPinProgramName] = useState(true);
  const [pinPdName, setPinPdName] = useState(true);
  const [pinShootingDate, setPinShootingDate] = useState(true);

  // 제출자
  const [submitterLinked, setSubmitterLinked] = useState(true);
  const [submitterName, setSubmitterName] = useState('');

  useEffect(() => {
    if (submitterLinked) setSubmitterName(userName);
  }, [submitterLinked, userName]);

  useEffect(() => {
    const vals: Record<string, string | undefined> = {};
    if (pinProgramName) vals.programName = programName;
    if (pinPdName) vals.pdName = pdName;
    if (pinShootingDate) vals.shootingDate = shootingDate;
    savePinnedValues(vals);
  }, [programName, pdName, shootingDate, pinProgramName, pinPdName, pinShootingDate]);

  // Files
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview (draggable + resizable)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 200, y: 100 });
  const [previewSize, setPreviewSize] = useState({ w: 500, h: 600 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // Grid data
  const [rows, setRows] = useState<GridRow[]>([]);

  // OCR
  const [loading, setLoading] = useState(false);

  // ── 영수증구분 셀 에디터 ──
  const receiptTypeColDef: ColDef = useMemo(() => ({
    field: 'receiptTypeLabel',
    headerName: '영수증구분',
    flex: 1,
    minWidth: 110,
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['제수수료', '시설장소', '소모품비', '여비교통비'],
    },
  }), []);

  // ── 금액 컬럼 ──
  const amountColDef: ColDef = useMemo(() => ({
    field: 'amount',
    headerName: '금액',
    flex: 1,
    minWidth: 100,
    editable: true,
    type: 'numericColumn',
    sort: 'desc' as const,
    valueFormatter: (p: { value: unknown }) =>
      (p.value != null && p.value !== 0 ? Number(p.value).toLocaleString() : ''),
    valueSetter: (p: { newValue: unknown; data: Record<string, unknown> }) => {
      const raw = String(p.newValue).replace(/[^0-9-]/g, '');
      p.data.amount = Number(raw) || 0;
      return true;
    },
  }), []);

  // ── 영수증 구분별 컬럼 정의 ──
  const travelColumns = useMemo<ColDef[]>(() => [
    { field: 'date', headerName: '일자', flex: 1, minWidth: 100, editable: true },
    { field: 'time', headerName: '시간', flex: 0.7, minWidth: 70, editable: true },
    { field: 'location', headerName: '이동장소(촬영지체크)', flex: 1.5, minWidth: 120, editable: true },
    { field: 'purpose', headerName: '용도(자세히)', flex: 1.5, minWidth: 120, editable: true },
    { field: 'user', headerName: '사용자', flex: 0.8, minWidth: 80, editable: true },
    amountColDef,
    { field: 'submitter', headerName: '제출자', flex: 0.8, minWidth: 80, editable: true },
    receiptTypeColDef,
  ], [amountColDef, receiptTypeColDef]);

  const otherColumns = useMemo<ColDef[]>(() => [
    { field: 'date', headerName: '일자', flex: 1, minWidth: 100, editable: true },
    { field: 'time', headerName: '시간', flex: 0.7, minWidth: 70, editable: true },
    { field: 'purpose', headerName: '용도(자세히)', flex: 1.5, minWidth: 120, editable: true },
    { field: 'detail', headerName: '내역', flex: 1.5, minWidth: 120, editable: true },
    { field: 'user', headerName: '사용자', flex: 0.8, minWidth: 80, editable: true },
    amountColDef,
    { field: 'submitter', headerName: '제출자', flex: 0.8, minWidth: 80, editable: true },
    receiptTypeColDef,
  ], [amountColDef, receiptTypeColDef]);

  const columns = useMemo(() => {
    return receiptType === 'travel' ? travelColumns : otherColumns;
  }, [receiptType, travelColumns, otherColumns]);

  // ── File handling ──
  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
    );
    const uploads: UploadedFile[] = arr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf',
    }));
    setFiles((prev) => [...prev, ...uploads]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  }, []);

  // ── OCR Analysis ──
  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) return;

    if (!userName.trim()) {
      notify('사용자를 입력해주세요.', { type: 'warning' });
      return;
    }

    setLoading(true);
    const newRows: GridRow[] = [];
    const errors: string[] = [];

    for (let fi = 0; fi < files.length; fi++) {
      const { file } = files[fi];
      try {
        const formData = new FormData();
        formData.append('file', file);

        const ocrModel = localStorage.getItem('pm-ocr-model') || 'claude-sonnet';
        const res = await authFetch(`/api/receipt/ocr/extract?model=${encodeURIComponent(ocrModel)}`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
          throw new Error(body.message || `HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || 'OCR 추출 실패');
        }

        const results = (Array.isArray(json.data) ? json.data : [json.data]) as OcrResult[];

        for (const result of results) {
          const ocrDate = extractDate(result.transaction_date);
          const ocrTime = extractTime(result.transaction_date);
          const currentTypeLabel = TYPE_SHORT_LABELS[receiptType] || '여비교통비';

          if (result.items && result.items.length > 0) {
            for (const item of result.items) {
              newRows.push({
                id: generateId(),
                date: ocrDate,
                time: ocrTime,
                location: result.handwritten_notes || '',
                purpose: [item.part_name, item.remarks].filter(Boolean).join(' / '),
                detail: '',
                user: userName,
                amount: item.amount || 0,
                submitter: submitterName,
                receiptTypeLabel: currentTypeLabel,
              });
            }
          } else {
            newRows.push({
              id: generateId(),
              date: ocrDate,
              time: ocrTime,
              location: result.handwritten_notes || '',
              purpose: result.supplier?.name || '',
              detail: '',
              user: userName,
              amount: result.summary?.total || 0,
              submitter: submitterName,
              receiptTypeLabel: currentTypeLabel,
            });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${file.name}: ${msg}`);
        setFiles((prev) =>
          prev.map((f, idx) => (idx === fi ? { ...f, error: msg } : f)),
        );
      }
    }

    if (newRows.length > 0) {
      setRows(prev => [...prev, ...newRows]);
    }

    if (errors.length > 0) {
      notify(`일부 파일 분석 실패:\n${errors.join('\n')}`, { type: 'error' });
    }

    setLoading(false);
  }, [files, submitterName, userName, receiptType]);

  // 저장 결과 메시지
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Batch save → DB ──
  const handleBatchSave = useCallback(async (modifiedRows: { _rowState: string; [key: string]: unknown }[]) => {
    try {
      const trackedIds = new Set(modifiedRows.map(r => String(r.id ?? r.__rowId ?? '')));
      const currentData = gridRef.current?.getDisplayedData() ?? (rows as unknown as Record<string, unknown>[]);
      const untrackedNewRows = currentData
        .filter(r => {
          const id = String(r.id ?? '');
          return id.startsWith('receipt_') && !trackedIds.has(id);
        })
        .map(r => ({ ...r, _rowState: 'created' as string }));

      const allModified = [...modifiedRows, ...untrackedNewRows];

      if (allModified.length === 0) {
        setSaveMessage({ text: '변경된 데이터가 없습니다.', type: 'error' });
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      const payload = allModified.map((row) => {
        const cleaned: Record<string, unknown> = { ...row };
        if (row._rowState === 'created') {
          delete cleaned.id;
        }
        for (const key of Object.keys(cleaned)) {
          if (cleaned[key] === '') cleaned[key] = null;
        }
        cleaned.programName = programName;
        cleaned.pdName = pdName;
        cleaned.shootingDate = shootingDate;
        const label = (row.receiptTypeLabel as string) || '';
        const mappedType = LABEL_TO_TYPE[label];
        cleaned.receiptType = mappedType || receiptType;
        return cleaned;
      });

      const res = await authFetch('/api/receipt/records/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const errMsg = json?.message || `HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      // 저장 완료 후 DB에서 최신 데이터 재조회
      const params = new URLSearchParams({ month: shootingDate, type: receiptType });
      const searchRes = await authFetch(`/api/receipt/records?${params.toString()}`);
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        if (searchJson.success && Array.isArray(searchJson.data)) {
          setRows((searchJson.data as Record<string, unknown>[]).map(toGridRow));
        } else {
          setRows([]);
        }
      }

      const savedCount = allModified.filter((r) => r._rowState !== 'deleted').length;
      const deletedCount = allModified.filter((r) => r._rowState === 'deleted').length;
      const msg = [
        savedCount > 0 ? `${savedCount}건 저장` : '',
        deletedCount > 0 ? `${deletedCount}건 삭제` : '',
      ].filter(Boolean).join(', ');
      setSaveMessage({ text: `${msg || '저장'} 완료 (${new Date().toLocaleTimeString()})`, type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMessage({ text: `저장 실패: ${msg}`, type: 'error' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  }, [shootingDate, receiptType, programName, pdName, rows]);

  // ── Custom Excel export ──
  const handleExcelExport = useCallback(async () => {
    const displayedData = gridRef.current?.getDisplayedData() ?? rows;
    const exportRows: ReceiptRow[] = displayedData.map((r: Record<string, unknown>, i: number) => ({
      no: i + 1,
      date: String(r.date ?? ''),
      time: String(r.time ?? ''),
      location: String(r.location ?? ''),
      purpose: String(r.purpose ?? ''),
      detail: String(r.detail ?? ''),
      user: String(r.user ?? ''),
      amount: Number(r.amount) || 0,
      submitter: String(r.submitter ?? ''),
    }));
    const meta: ReceiptMeta = { programName, shootingDate, pdName };
    const typeShort = TYPE_SHORT_LABELS[receiptType] || '여비교통비';
    const fName = `(가지급) 기타 내역서-${typeShort}`;
    await exportReceiptExcel(exportRows, meta, fName, receiptType);
  }, [rows, programName, shootingDate, pdName, receiptType]);

  // ── Preview ──
  const openPreview = useCallback((url: string, isPdf: boolean) => {
    setPreviewUrl(url);
    setPreviewIsPdf(isPdf);
    setPreviewPos({ x: 200, y: 100 });
    setPreviewSize({ w: isPdf ? 700 : 500, h: 600 });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewUrl(null);
    setPreviewIsPdf(false);
  }, []);

  const onPreviewMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: previewPos.x, origY: previewPos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPreviewPos({
        x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [previewPos]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: previewSize.w, origH: previewSize.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setPreviewSize({
        w: Math.max(200, resizeRef.current.origW + (ev.clientX - resizeRef.current.startX)),
        h: Math.max(200, resizeRef.current.origH + (ev.clientY - resizeRef.current.startY)),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [previewSize]);

  const typeLabel = useMemo(() => {
    const found = RECEIPT_TYPES.find((rt) => rt.value === receiptType);
    return found ? found.label : '여비교통비(가지급)';
  }, [receiptType]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        borderBottom: '1px solid #e2e8f0', background: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          영수증 등록
        </h2>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
        {/* ── Basic info panel ── */}
        <div style={{
          background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 6,
          padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 24, alignItems: 'stretch',
        }}>
          {/* Left: 2-column grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '6px 20px', minWidth: 0, flex: 1,
          }}>
            {/* Row 1: 프로그램명, 촬영일자 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={labelStyle}>프로그램명</label>
              <input value={programName} onChange={(e) => setProgramName(e.target.value)}
                style={{ ...inputStyle, flex: 1 }} placeholder="예: 프로그램명" />
              <label style={pinLabelStyle} title="고정: 다음 접속 시 값 유지">
                <input type="checkbox" checked={pinProgramName}
                  onChange={(e) => setPinProgramName(e.target.checked)} style={{ margin: 0 }} />
                고정
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={labelStyle}>촬영일자</label>
              <input type="month" value={shootingDate} onChange={(e) => setShootingDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }} />
              <label style={pinLabelStyle} title="고정: 다음 접속 시 값 유지">
                <input type="checkbox" checked={pinShootingDate}
                  onChange={(e) => setPinShootingDate(e.target.checked)} style={{ margin: 0 }} />
                고정
              </label>
            </div>

            {/* Row 2: 담당PD, 사용자 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={labelStyle}>담당 PD</label>
              <input value={pdName} onChange={(e) => setPdName(e.target.value)}
                style={{ ...inputStyle, flex: 1 }} />
              <label style={pinLabelStyle} title="고정: 다음 접속 시 값 유지">
                <input type="checkbox" checked={pinPdName}
                  onChange={(e) => setPinPdName(e.target.checked)} style={{ margin: 0 }} />
                고정
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={labelStyle}>사용자</label>
              <input value={userName} onChange={(e) => setUserName(e.target.value)}
                style={{ ...inputStyle, flex: 1 }} />
            </div>

            {/* Row 3: 영수증구분 + 제출자 */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={labelStyle}>영수증구분</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1 }}>
                {RECEIPT_TYPES.map((rt) => (
                  <label key={rt.value} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, cursor: 'pointer', color: '#334155',
                  }}>
                    <input type="radio" name="receiptType" value={rt.value}
                      checked={receiptType === rt.value}
                      onChange={(e) => setReceiptType(e.target.value)} style={{ margin: 0 }} />
                    {rt.label}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, flexShrink: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
                  <input type="checkbox" checked={submitterLinked}
                    onChange={(e) => setSubmitterLinked(e.target.checked)} style={{ margin: 0 }} />
                  제출자:
                </label>
                <input value={submitterName}
                  onChange={(e) => { if (!submitterLinked) setSubmitterName(e.target.value); }}
                  readOnly={submitterLinked}
                  style={{ ...inputStyle, width: 100, backgroundColor: submitterLinked ? '#f1f5f9' : '#fff' }}
                  placeholder="이름" />
              </div>
            </div>
          </div>

          {/* Right: Approval table */}
          <table style={{ borderCollapse: 'collapse', fontSize: 12, alignSelf: 'stretch', height: '100%' }}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{
                  ...approvalCellStyle, width: 64, verticalAlign: 'middle',
                  textAlign: 'center', fontWeight: 700, fontSize: 13, letterSpacing: 6,
                }}>
                  결 재
                </td>
                <td style={{ ...approvalCellStyle, width: 126, textAlign: 'center', fontWeight: 600 }}>PD</td>
                <td style={{ ...approvalCellStyle, width: 126, textAlign: 'center', fontWeight: 600 }}>C P</td>
              </tr>
              <tr>
                <td style={{ ...approvalCellStyle, height: 71 }}></td>
                <td style={{ ...approvalCellStyle, height: 71 }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Upload bar + Analyze button ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'stretch' }}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1, border: '2px dashed #cbd5e1', borderRadius: 6,
              padding: '10px 16px', cursor: 'pointer', minHeight: 56,
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#fff',
            }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
            {files.length === 0 && (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                영수증 이미지 또는 PDF를 드래그하거나 클릭하여 업로드
              </span>
            )}
            {files.map((f, i) => (
              <div key={i} style={{
                position: 'relative', width: 42, height: 42, borderRadius: 4,
                overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0,
              }} onClick={(e) => e.stopPropagation()}>
                {f.isPdf ? (
                  <div title={f.error ? `오류: ${f.error}` : f.file.name}
                    style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', background: f.error ? '#fef2f2' : '#eff6ff',
                      cursor: 'pointer', flexDirection: 'column', gap: 1,
                    }}
                    onClick={() => openPreview(f.preview, true)}>
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                      <path d="M10 0H2C0.9 0 0 0.9 0 2v14c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V6L10 0z"
                        fill={f.error ? '#ef4444' : '#3b82f6'} opacity="0.15" />
                      <path d="M10 0L16 6H12C10.9 6 10 5.1 10 4V0z"
                        fill={f.error ? '#ef4444' : '#3b82f6'} opacity="0.3" />
                      <path d="M10 0H2C0.9 0 0 0.9 0 2v14c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V6L10 0z"
                        stroke={f.error ? '#ef4444' : '#3b82f6'} strokeWidth="0.5" fill="none" />
                    </svg>
                    <span style={{ fontSize: 7, fontWeight: 700, color: f.error ? '#ef4444' : '#3b82f6', lineHeight: 1 }}>PDF</span>
                  </div>
                ) : (
                  <img src={f.preview} alt=""
                    title={f.error ? `오류: ${f.error}` : f.file.name}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer',
                      outline: f.error ? '2px solid #ef4444' : 'none',
                    }}
                    onClick={() => openPreview(f.preview, false)} />
                )}
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    position: 'absolute', top: -2, right: -2, width: 16, height: 16,
                    borderRadius: '50%', background: '#ef4444', color: '#fff',
                    border: 'none', fontSize: 10, lineHeight: '16px', cursor: 'pointer', padding: 0,
                  }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => { files.forEach((f) => URL.revokeObjectURL(f.preview)); setFiles([]); }}
            disabled={files.length === 0}
            style={{
              padding: '6px 16px', background: '#fff', color: '#64748b',
              border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13,
              fontWeight: 600, cursor: files.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}>
            초기화
          </button>
          <button onClick={handleAnalyze} disabled={loading || files.length === 0}
            style={{
              padding: '6px 24px', background: loading ? '#94a3b8' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 6, fontSize: 13,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}>
            {loading ? '분석 중...' : '분석'}
          </button>
        </div>

        {/* ── Grid title ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            * {typeLabel} 내역: {shootingDate || '미지정'}
          </span>
        </div>

        {/* ── Grid ── */}
        <PeakEditGrid
          ref={gridRef}
          gridId="receipt-registration"
          columns={columns}
          data={rows as unknown as Record<string, unknown>[]}
          onBatchSave={handleBatchSave}
          bodyHeight={700}
          saveButtonLabel="저장"
          permission={perm}
          extraToolbarButtons={
            <button onClick={handleExcelExport}
              style={{
                padding: '4px 12px', background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              엑셀 저장 (서식)
            </button>
          }
        />
      </div>

      {/* ── 저장 결과 메시지 ── */}
      {saveMessage && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 10001,
          padding: '12px 20px', borderRadius: 6,
          background: saveMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${saveMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: saveMessage.type === 'success' ? '#166534' : '#991b1b',
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {saveMessage.text}
        </div>
      )}

      {/* ── Loading overlay ── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, border: '4px solid #e2e8f0',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
              영수증을 분석하고 있습니다...
            </div>
            <div style={{ fontSize: 14, color: '#1e293b', marginTop: 8, lineHeight: 1.5 }}>
              분석된 리스트만 그리드에 표시됩니다.<br />
              저장 후 조회하면 전체 리스트가 나옵니다.
            </div>
          </div>
        </div>
      )}

      {/* ── File preview popup (draggable + resizable) ── */}
      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000 }}
          onClick={closePreview}>
          <div onMouseDown={onPreviewMouseDown} onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', left: previewPos.x, top: previewPos.y,
              width: previewSize.w, height: previewSize.h,
              background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'move',
            }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                {previewIsPdf ? 'PDF 미리보기' : '이미지 미리보기'}
              </span>
              <button onClick={closePreview}
                style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#64748b', padding: '0 4px' }}>
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', cursor: 'default' }}
              onMouseDown={(e) => e.stopPropagation()}>
              {previewIsPdf ? (
                <iframe src={previewUrl} title="PDF 미리보기"
                  style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                  <img src={previewUrl} alt="preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
            <div onMouseDown={onResizeMouseDown}
              style={{
                position: 'absolute', right: 0, bottom: 0, width: 18, height: 18,
                cursor: 'nwse-resize', background: 'linear-gradient(135deg, transparent 50%, #94a3b8 50%)',
                borderRadius: '0 0 8px 0',
              }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, width: 70, flexShrink: 0, color: '#334155',
};

const inputStyle: React.CSSProperties = {
  padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, outline: 'none',
};

const pinLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 3, fontSize: 11,
  color: '#94a3b8', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
};

const approvalCellStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0', padding: '4px 12px', textAlign: 'center',
  fontSize: 12, fontWeight: 600, background: '#fff',
};
