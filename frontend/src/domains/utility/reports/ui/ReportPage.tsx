import { useState, useCallback, useEffect, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface ReportTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  parametersJson: string;
}

interface TemplateParam {
  name: string;
  label: string;
  type: string;
}

const CATEGORIES = [
  { key: 'ALL', label: '전체' },
  { key: 'SALES', label: '영업' },
  { key: 'PRODUCTION', label: '생산' },
  { key: 'QUALITY', label: '품질' },
  { key: 'LOGISTICS', label: '물류' },
];

const CATEGORY_COLORS: Record<string, string> = {
  SALES: '#3b82f6',
  PRODUCTION: '#10b981',
  QUALITY: '#f59e0b',
  LOGISTICS: '#8b5cf6',
};

export default function ReportPage() {
  const perm = usePermission('UT0020');
  const { notify } = useToast();

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  // Inline report (title + format + sample data)
  const [showInline, setShowInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('리포트');
  const [inlineFormat, setInlineFormat] = useState('PDF');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/reports/templates');
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch { notify('보고서 조회에 실패했습니다', { type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (activeCategory !== 'ALL') {
      list = list.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, activeCategory, search]);

  const handleGenerateTemplate = useCallback(async (template: ReportTemplate, mode: 'preview' | 'download') => {
    setGenerating(template.code);
    try {
      const params: Record<string, unknown> = {};
      // Parse template parameters and prompt
      let templateParams: TemplateParam[] = [];
      try { templateParams = JSON.parse(template.parametersJson || '[]'); } catch { notify('보고서 설정 로드에 실패했습니다', { type: 'error' }); }

      for (const p of templateParams) {
        const value = prompt(`${p.label}을(를) 입력하세요:`);
        if (value === null) { setGenerating(null); return; }
        params[p.name] = p.type === 'long' ? parseInt(value, 10) : value;
      }

      const res = await authFetch(`/api/reports/generate/${template.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      if (mode === 'preview') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      notify(`${template.name} 생성 완료`, { type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`리포트 생성 실패: ${msg}`, { type: 'error' });
    } finally {
      setGenerating(null);
    }
  }, [notify]);

  // Inline report generation (dynamic data)
  const handleInlineGenerate = useCallback(async () => {
    setGenerating('inline');
    try {
      const request = {
        title: inlineTitle,
        format: inlineFormat,
        columns: [
          { field: 'no', headerName: 'No', width: 50 },
          { field: 'name', headerName: '이름', width: 150 },
          { field: 'department', headerName: '부서', width: 150 },
          { field: 'date', headerName: '날짜', width: 100 },
        ],
        data: [
          { no: '1', name: '홍길동', department: '개발팀', date: '2026-03-25' },
          { no: '2', name: '김영희', department: '기획팀', date: '2026-03-25' },
          { no: '3', name: '이철수', department: '영업팀', date: '2026-03-25' },
        ],
      };
      const res = await authFetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inlineTitle}.${inlineFormat.toLowerCase() === 'xlsx' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
      notify('리포트가 생성되었습니다', { type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`리포트 생성 실패: ${msg}`, { type: 'error' });
    } finally {
      setGenerating(null);
    }
  }, [inlineTitle, inlineFormat, notify]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 16px' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '8px 20px', border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              background: activeCategory === cat.key ? '#fff' : '#f8fafc',
              color: activeCategory === cat.key ? '#3b82f6' : '#64748b',
              borderBottom: activeCategory === cat.key ? '2px solid #3b82f6' : '2px solid transparent',
            }}>
            {cat.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="템플릿 검색..."
          style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, width: 200, margin: '4px 0' }} />
        {perm.canExport && (
          <button onClick={() => setShowInline(!showInline)}
            style={{
              padding: '4px 12px', background: showInline ? '#f59e0b' : '#6b7280', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 8, alignSelf: 'center',
            }}>
            {showInline ? '인라인 닫기' : '인라인 리포트'}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Inline report panel */}
        {showInline && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
            padding: 16, marginBottom: 16,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>인라인 리포트 생성</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>제목</label>
                <input value={inlineTitle} onChange={e => setInlineTitle(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13, width: 200 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>형식</label>
                <select value={inlineFormat} onChange={e => setInlineFormat(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }}>
                  <option value="PDF">PDF</option>
                  <option value="XLSX">XLSX</option>
                </select>
              </div>
              {perm.canExport && (
                <button onClick={handleInlineGenerate} disabled={generating === 'inline'}
                  style={{
                    padding: '6px 20px', background: generating === 'inline' ? '#94a3b8' : '#f59e0b', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: generating === 'inline' ? 'not-allowed' : 'pointer',
                  }}>
                  {generating === 'inline' ? '생성 중...' : '생성'}
                </button>
              )}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#92400e' }}>
              샘플 데이터로 리포트를 생성합니다. 각 페이지에서 그리드 데이터를 기반으로 생성하는 기능은 추후 연동 예정입니다.
            </p>
          </div>
        )}

        {/* Template cards */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            {templates.length === 0 ? '등록된 리포트 템플릿이 없습니다' : '검색 결과가 없습니다'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredTemplates.map(t => {
              const catColor = CATEGORY_COLORS[t.category] || '#64748b';
              return (
                <div key={t.id} style={{
                  border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: catColor,
                        background: `${catColor}15`, padding: '2px 8px', borderRadius: 10,
                      }}>
                        {CATEGORIES.find(c => c.key === t.category)?.label || t.category}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.code}</span>
                    </div>
                    <h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{t.name}</h3>
                  </div>
                  <div style={{ padding: '8px 16px', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                      {t.description || '설명 없음'}
                    </p>
                  </div>
                  {perm.canExport && (
                    <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                      <button onClick={() => handleGenerateTemplate(t, 'preview')}
                        disabled={generating === t.code}
                        style={{
                          flex: 1, padding: '6px 0', background: '#fff', color: '#3b82f6',
                          border: '1px solid #3b82f6', borderRadius: 4, fontSize: 12,
                          fontWeight: 600, cursor: generating === t.code ? 'not-allowed' : 'pointer',
                        }}>
                        미리보기
                      </button>
                      <button onClick={() => handleGenerateTemplate(t, 'download')}
                        disabled={generating === t.code}
                        style={{
                          flex: 1, padding: '6px 0', background: '#3b82f6', color: '#fff',
                          border: 'none', borderRadius: 4, fontSize: 12,
                          fontWeight: 600, cursor: generating === t.code ? 'not-allowed' : 'pointer',
                        }}>
                        {generating === t.code ? '생성 중...' : '다운로드'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
