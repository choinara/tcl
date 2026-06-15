import { useState, useCallback, useEffect, useMemo } from 'react';
import i18next from 'i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/shared/components/toast/ToastProvider';

interface I18nRow {
  id?: number;
  langCode: string;
  messageKey: string;
  messageValue: string;
  updatedAt?: string;
}

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa' },
  { code: 'th', label: 'ไทย' },
];

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = v != null ? String(v) : '';
    }
  }
  return result;
}

export default function I18nManagementPage() {
  const perm = usePermission('SM0100');
  const { notify } = useToast();

  const [rows, setRows] = useState<I18nRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [changes, setChanges] = useState<Map<string, I18nRow>>(new Map());
  const [editCell, setEditCell] = useState<{ key: string; lang: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/system/i18n/messages');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json.data || []);
      setChanges(new Map());
    } catch {
      notify('다국어 데이터 조회 실패', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group rows by messageKey, with columns for each language
  const grouped = useMemo(() => {
    const map = new Map<string, Record<string, I18nRow>>();
    for (const row of rows) {
      if (!map.has(row.messageKey)) map.set(row.messageKey, {});
      map.get(row.messageKey)![row.langCode] = row;
    }

    let keys = Array.from(map.keys()).sort();

    if (keyword) {
      const kw = keyword.toLowerCase();
      keys = keys.filter(k => {
        if (k.toLowerCase().includes(kw)) return true;
        const langMap = map.get(k)!;
        return Object.values(langMap).some(r => r.messageValue?.toLowerCase().includes(kw));
      });
    }

    if (filterMode === 'missing') {
      keys = keys.filter(k => {
        const langMap = map.get(k)!;
        return LANGUAGES.some(l => !langMap[l.code]?.messageValue);
      });
    }

    return keys.map(key => ({ key, langs: map.get(key)! }));
  }, [rows, keyword, filterMode]);

  const missingCount = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!map.has(row.messageKey)) map.set(row.messageKey, new Set());
      if (row.messageValue) map.get(row.messageKey)!.add(row.langCode);
    }
    let count = 0;
    for (const [, langs] of map) {
      count += LANGUAGES.filter(l => !langs.has(l.code)).length;
    }
    return count;
  }, [rows]);

  const handleStartEdit = (key: string, lang: string, currentValue: string) => {
    setEditCell({ key, lang });
    setEditValue(currentValue || '');
  };

  const handleFinishEdit = () => {
    if (!editCell) return;
    const { key, lang } = editCell;
    const changeKey = `${lang}:${key}`;
    const existing = rows.find(r => r.langCode === lang && r.messageKey === key);

    if (existing && existing.messageValue === editValue) {
      setEditCell(null);
      return;
    }

    const updated: I18nRow = {
      id: existing?.id,
      langCode: lang,
      messageKey: key,
      messageValue: editValue,
    };
    setChanges(prev => new Map(prev).set(changeKey, updated));

    setRows(prev => {
      const idx = prev.findIndex(r => r.langCode === lang && r.messageKey === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], messageValue: editValue };
        return copy;
      }
      return [...prev, updated];
    });
    setEditCell(null);
  };

  const handleSave = useCallback(async () => {
    if (changes.size === 0) { notify('변경사항이 없습니다', { type: 'info' }); return; }
    setSaving(true);
    try {
      const payload = Array.from(changes.values()).map(c => ({
        langCode: c.langCode,
        messageKey: c.messageKey,
        messageValue: c.messageValue,
      }));
      const res = await authFetch('/api/system/i18n/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify(`${changes.size}건 저장 완료`, { type: 'success' });
      setChanges(new Map());
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`저장 실패: ${msg}`, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [changes, notify, fetchData]);

  const handleSyncToDB = useCallback(async () => {
    setSaving(true);
    try {
      // Collect all translations from i18next bundles
      const syncRequests: Array<{ langCode: string; messageKey: string; messageValue: string }> = [];
      for (const lang of LANGUAGES) {
        const bundle = i18next.getResourceBundle(lang.code, 'translation') || {};
        const flat = flattenObject(bundle);
        for (const [key, val] of Object.entries(flat)) {
          if (val) {
            syncRequests.push({ langCode: lang.code, messageKey: key, messageValue: val });
          }
        }
      }

      const res = await authFetch('/api/system/i18n/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncRequests),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      notify(`DB 동기화 완료: ${json.data}건 등록`, { type: 'success' });
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(`동기화 실패: ${msg}`, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [notify, fetchData]);

  const handleAddKey = useCallback(() => {
    const newKey = prompt('새 메시지 키를 입력하세요 (예: page.myPage.title)');
    if (!newKey || !newKey.trim()) return;
    const key = newKey.trim();
    if (rows.some(r => r.messageKey === key)) {
      notify('이미 존재하는 키입니다', { type: 'error' });
      return;
    }
    const newRows: I18nRow[] = LANGUAGES.map(l => ({
      langCode: l.code,
      messageKey: key,
      messageValue: '',
    }));
    setRows(prev => [...prev, ...newRows]);
    for (const nr of newRows) {
      setChanges(prev => new Map(prev).set(`${nr.langCode}:${nr.messageKey}`, nr));
    }
  }, [rows, notify]);

  const handleDownloadJson = useCallback((langCode: string) => {
    const bundle = i18next.getResourceBundle(langCode, 'translation') || {};
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${langCode}_translation.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const cellStyle: React.CSSProperties = { padding: '4px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12 };
  const headerStyle: React.CSSProperties = { ...cellStyle, background: '#f8fafc', fontWeight: 600, textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 };
  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    padding: '4px 12px', background: disabled ? '#94a3b8' : color, color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', marginRight: 4,
  });

  const allKeys = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => set.add(r.messageKey));
    return set.size;
  }, [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      {/* Info bar */}
      <div style={{ padding: '4px 16px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
        전체 키: {allKeys} | 미번역: {missingCount}
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="키 또는 값 검색"
          style={{ width: 250, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }} />
        <select value={filterMode} onChange={e => setFilterMode(e.target.value as 'all' | 'missing')}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 13 }}>
          <option value="all">전체 ({allKeys})</option>
          <option value="missing">미번역 ({missingCount})</option>
        </select>
        {perm.canCreate && (
          <button onClick={handleAddKey} style={btnStyle('#10b981')}>+ 키 추가</button>
        )}
        <div style={{ flex: 1 }} />
        {changes.size > 0 && (
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{changes.size}건 변경됨</span>
        )}
        {perm.canUpdate && (
          <button onClick={handleSave} disabled={saving} style={btnStyle('#3b82f6', saving)}>
            {saving ? '저장 중...' : '저장'}
          </button>
        )}
        {perm.canCreate && (
          <button onClick={handleSyncToDB} disabled={saving} style={btnStyle('#8b5cf6', saving)}>
            DB 동기화
          </button>
        )}
        <button onClick={fetchData} style={btnStyle('#6b7280')}>새로고침</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 40 }}>No.</th>
                <th style={{ ...headerStyle, width: 260 }}>키</th>
                {LANGUAGES.map(l => (
                  <th key={l.code} style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{l.label}</span>
                      <button onClick={() => handleDownloadJson(l.code)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#3b82f6', padding: '0 2px' }}>
                        JSON
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map((g, idx) => (
                <tr key={g.key}>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 11, color: '#475569' }} title={g.key}>{g.key}</td>
                  {LANGUAGES.map(l => {
                    const val = g.langs[l.code]?.messageValue || '';
                    const isEditing = editCell?.key === g.key && editCell?.lang === l.code;
                    const isChanged = changes.has(`${l.code}:${g.key}`);
                    const isMissing = !val;
                    return (
                      <td key={l.code}
                        style={{
                          ...cellStyle,
                          background: isChanged ? '#eff6ff' : isMissing ? '#fef9c3' : undefined,
                          cursor: 'pointer', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        title={val}
                        onClick={() => !isEditing && perm.canUpdate && handleStartEdit(g.key, l.code, val)}>
                        {isEditing ? (
                          <input value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={e => { if (e.key === 'Enter') handleFinishEdit(); if (e.key === 'Escape') setEditCell(null); }}
                            autoFocus
                            style={{ width: '100%', padding: '2px 4px', border: '1px solid #3b82f6', borderRadius: 2, fontSize: 12, outline: 'none' }} />
                        ) : (
                          <span style={{ color: isMissing ? '#d97706' : undefined }}>{val || '(미입력)'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {grouped.length === 0 && (
                <tr><td colSpan={2 + LANGUAGES.length} style={{ ...cellStyle, textAlign: 'center', color: '#94a3b8', padding: 24 }}>데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
