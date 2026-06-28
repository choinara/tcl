import { useState, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/useToast';

export default function ExcelConvertPage() {
  usePermission('UT0030');
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'download' | 'save'>('download');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ outputDirectory: string; sheetCount: number; files: { sheetName: string; csvPath: string; pdfPath: string }[] } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (mode === 'download') {
        const res = await authFetch('/api/excel/convert/download', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.(xlsx|xls)$/, '_converted.zip');
        a.click();
        URL.revokeObjectURL(url);
        notify('변환 완료 — ZIP 파일이 다운로드됩니다', { type: 'success' });
      } else {
        const res = await authFetch('/api/excel/convert/save', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResult(json);
        notify(`${json.sheetCount}개 시트 변환 완료`, { type: 'success' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`변환 실패: ${msg}`, { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [file, mode, notify]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>
      <div style={{ padding: 24, maxWidth: 700 }}>
        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #cbd5e1', borderRadius: 8, padding: 32,
            textAlign: 'center', cursor: 'pointer', marginBottom: 16,
            background: file ? '#f0fdf4' : '#fafafa',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResult(null); } e.target.value = ''; }} />
          {file ? (
            <div style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>{file.name} ({(file.size / 1024).toFixed(1)}KB)</div>
          ) : (
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Excel 파일(.xlsx, .xls)을 드래그하거나 클릭하여 업로드</div>
          )}
        </div>

        {/* Mode selection */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name="mode" checked={mode === 'download'} onChange={() => setMode('download')} />
            ZIP 다운로드 (시트별 CSV + PDF)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name="mode" checked={mode === 'save'} onChange={() => setMode('save')} />
            서버 저장
          </label>
        </div>

        <button onClick={handleConvert} disabled={loading || !file}
          style={{
            padding: '8px 24px', background: loading || !file ? '#94a3b8' : '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
            cursor: loading || !file ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '변환 중...' : '변환'}
        </button>

        {/* Result table */}
        {result && (
          <div style={{ marginTop: 24, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', background: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
              변환 결과 — {result.outputDirectory}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>시트명</th>
                  <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>CSV 경로</th>
                  <th style={{ padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>PDF 경로</th>
                </tr>
              </thead>
              <tbody>
                {result.files.map((f, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid #f1f5f9' }}>{f.sheetName}</td>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>{f.csvPath}</td>
                    <td style={{ padding: '6px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>{f.pdfPath}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
