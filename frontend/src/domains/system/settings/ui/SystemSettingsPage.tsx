import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { TabPanel } from '@/components/ui/TabPanel';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import type { GridFeatureToggles } from '@/components/grid/types';
import { DEFAULT_GRID_FEATURES } from '@/components/grid/types';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface ApiKeyStatus {
  key: string;
  set: boolean;
  masked: string;
}

interface ApiKeyDef {
  key: string;
  label: string;
  desc: string;
  placeholder: string;
}

interface SecuritySettings {
  apiKeys?: ApiKeyStatus[];
  customDefs?: string;
}

interface MailTestResult {
  message?: string;
  success?: boolean;
}

/** 기본 제공 API 키 정의 (삭제 불가) */
const PREDEFINED_API_KEY_DEFS: ApiKeyDef[] = [
  {
    key: 'ocr.anthropic.api-key',
    label: 'Claude API Key',
    desc: '영수증/문서 OCR 분석에 사용되는 Anthropic Claude API 키',
    placeholder: 'sk-ant-api03-...',
  },
];

function SingleLoginSettingBlock() {
  const perm = usePermission('SM0040');
  const { notify } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: { enabled: boolean } }>('/system/settings/single-login')
      .then(res => {
        const data = (res as unknown as { data: { data: { enabled: boolean } } }).data;
        setEnabled(data.data?.enabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async () => {
    const newValue = !enabled;
    setSaving(true);
    try {
      await api.put('/system/settings/single-login', { enabled: newValue });
      setEnabled(newValue);
      notify(newValue ? '다중로그인이 제한됩니다. (1인 1세션)' : '다중로그인이 허용됩니다.', { type: 'success' });
    } catch {
      notify('설정 변경에 실패했습니다.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [enabled, notify]);

  if (loading) return null;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8,
      }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
          다중로그인 설정
        </h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>
            다중로그인 제한
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {enabled
              ? 'ON — 동일 계정으로 1개의 세션만 허용됩니다. 새로 로그인하면 이전 세션이 자동 종료됩니다.'
              : 'OFF — 동일 계정으로 여러 브라우저/기기에서 동시 로그인이 가능합니다.'}
          </div>
        </div>
        {perm.canUpdate && (
          <button
            onClick={handleToggle}
            disabled={saving}
            style={{
              padding: '6px 16px', borderRadius: 4, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)', fontWeight: 600, flexShrink: 0, marginLeft: 16,
              background: enabled ? '#16a34a' : '#e5e7eb',
              color: enabled ? '#fff' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            {saving ? '변경 중...' : enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>
    </div>
  );
}

function SecuritySettingsPanel() {
  const perm = usePermission('SM0040');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [settings, setSettings] = useState<SecuritySettings>({});
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set());
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const emptyRow = () => ({ label: '', key: '', desc: '', placeholder: '' });
  const [addRows, setAddRows] = useState<ApiKeyDef[]>([emptyRow()]);

  const loadSettings = () => {
    setLoading(true);
    api.get<SecuritySettings>('/system/settings/security')
      .then(res => {
        setSettings(res.data);
        setApiKeyInputs({});
        setEditingKeys(new Set());
      })
      .catch(err => console.error('보안 설정 조회 실패:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  // 사용자 정의 키 파싱
  const customDefs: ApiKeyDef[] = useMemo(() => {
    try { return settings.customDefs ? JSON.parse(settings.customDefs) : []; }
    catch { return []; }
  }, [settings.customDefs]);

  // 기본 + 사용자 정의 병합
  const allDefs: (ApiKeyDef & { custom: boolean })[] = useMemo(() => {
    const predefinedKeys = new Set(PREDEFINED_API_KEY_DEFS.map(d => d.key));
    return [
      ...PREDEFINED_API_KEY_DEFS.map(d => ({ ...d, custom: false })),
      ...customDefs.filter(d => !predefinedKeys.has(d.key)).map(d => ({ ...d, custom: true })),
    ];
  }, [customDefs]);

  // ── 수정 모드 전환 ──
  const handleEdit = (key: string) => {
    setEditingKeys(prev => { const s = new Set(prev); s.add(key); return s; });
    setApiKeyInputs(prev => ({ ...prev, [key]: '' }));
  };
  const handleCancelEdit = (key: string) => {
    setEditingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
    setApiKeyInputs(prev => ({ ...prev, [key]: '' }));
  };

  // ── 개별 API 키 저장 ──
  const handleSaveApiKey = async (settingKey: string) => {
    const value = apiKeyInputs[settingKey]?.trim();
    if (!value) return;
    setSavingKeys(prev => ({ ...prev, [settingKey]: true }));
    try {
      const res = await api.put<ApiKeyStatus>('/system/settings/security/api-key', { key: settingKey, value });
      setSettings(prev => {
        const existing = prev.apiKeys || [];
        return { ...prev, apiKeys: [...existing.filter(k => k.key !== settingKey), res.data] };
      });
      setApiKeyInputs(prev => ({ ...prev, [settingKey]: '' }));
      setEditingKeys(prev => { const s = new Set(prev); s.delete(settingKey); return s; });
      notify('API 키 저장 완료', { type: 'success' });
    } catch (err) {
      console.error('API key save failed:', err);
      notify('API 키 저장 실패', { type: 'error' });
    } finally {
      setSavingKeys(prev => ({ ...prev, [settingKey]: false }));
    }
  };

  // ── 삭제 (기본 키: 값만 삭제 / 사용자 정의: 정의+값 삭제) ──
  const handleDelete = async (def: ApiKeyDef & { custom: boolean }) => {
    const msg = def.custom
      ? '이 API 키를 삭제하시겠습니까?\n정의와 저장된 값이 모두 삭제됩니다.'
      : '저장된 API 키 값을 삭제하시겠습니까?';
    if (!await confirmDialog(msg)) return;
    try {
      if (def.custom) {
        await api.delete(`/system/settings/security/api-key-defs?key=${encodeURIComponent(def.key)}`);
      } else {
        await api.delete(`/system/settings/security/api-key?key=${encodeURIComponent(def.key)}`);
      }
      loadSettings();
    } catch (err) {
      console.error('Delete failed:', err);
      notify('삭제 실패', { type: 'error' });
    }
  };

  // ── 모달: 일괄 추가 ──
  const updateAddRow = (idx: number, field: keyof ApiKeyDef, value: string) => {
    setAddRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const removeAddRow = (idx: number) => {
    setAddRows(prev => prev.filter((_, i) => i !== idx));
  };
  const handleAddDefs = async () => {
    const validRows = addRows.filter(r => r.label.trim() && r.key.trim());
    if (validRows.length === 0) {
      notify('키 이름과 설정키는 필수입니다.', { type: 'warning' });
      return;
    }
    try {
      for (const row of validRows) {
        await api.post('/system/settings/security/api-key-defs', row);
      }
      setShowAddModal(false);
      setAddRows([emptyRow()]);
      loadSettings();
    } catch (err) {
      console.error('Add API key defs failed:', err);
      notify('API 키 정의 추가 실패', { type: 'error' });
    }
  };
  const openAddModal = () => {
    setAddRows([emptyRow()]);
    setShowAddModal(true);
  };

  const inputBase: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 'var(--font-size-sm)',
  };

  if (loading) {
    return <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{'로딩 중...'}</span>;
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
      {/* ── 1열: 다중로그인 설정 ── */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16 }}>
        <SingleLoginSettingBlock />
      </div>

      {/* ── 2열: API 키 관리 ── */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
              API 키 관리
            </h3>
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#fef3c7', color: '#92400e' }}>
              AES-256-GCM
            </span>
          </div>
          {perm.canUpdate && (
            <button onClick={openAddModal} className="mes-btn mes-btn-new" style={{ fontSize: 11, padding: '3px 12px' }}>
              + 추가
            </button>
          )}
        </div>

        {/* API 키 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allDefs.map(def => {
            const status = settings.apiKeys?.find(k => k.key === def.key);
            const isSet = status?.set ?? false;
            const isEditing = editingKeys.has(def.key);
            const inputVal = apiKeyInputs[def.key] || '';
            const isSaving = savingKeys[def.key] || false;
            return (
              <div key={def.key} style={{
                padding: 14, borderRadius: 6,
                border: isEditing ? '1px solid var(--color-primary, #2563eb)' : '1px solid var(--color-border)',
                background: 'var(--color-bg-white, #fff)',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* 타이틀 행 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                      {def.label}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                      background: isSet ? '#f0fdf4' : '#f8fafc',
                      color: isSet ? '#16a34a' : '#94a3b8',
                      border: `1px solid ${isSet ? '#bbf7d0' : '#e2e8f0'}`,
                      fontWeight: 500,
                    }}>
                      {isSet ? '등록됨' : '미등록'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {perm.canUpdate && (
                      <>
                        <button
                          onClick={() => handleDelete(def)}
                          className="mes-btn mes-btn-delete"
                          style={{ fontSize: 10, padding: '2px 8px' }}
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => isEditing ? handleCancelEdit(def.key) : handleEdit(def.key)}
                          className="mes-btn mes-btn-edit"
                          style={{ fontSize: 10, padding: '2px 8px' }}
                        >
                          {isEditing ? '취소' : '수정'}
                        </button>
                        <button
                          onClick={() => handleSaveApiKey(def.key)}
                          disabled={!isEditing || isSaving || !inputVal.trim()}
                          className="mes-btn mes-btn-save"
                          style={{ fontSize: 10, padding: '2px 8px', opacity: (isEditing && inputVal.trim()) ? 1 : 0.3 }}
                        >
                          {isSaving ? '...' : '저장'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p style={{
                  fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
                  margin: '0 0 8px', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', flex: 1,
                }}>
                  {def.desc}
                </p>

                <input
                  type={isEditing ? 'password' : 'text'}
                  value={isEditing ? inputVal : (isSet ? '•••••••••••••••' : '')}
                  onChange={e => setApiKeyInputs(prev => ({ ...prev, [def.key]: e.target.value }))}
                  disabled={!isEditing}
                  placeholder={isEditing ? (def.placeholder || 'API 키를 입력하세요') : '수정 버튼을 클릭하여 입력'}
                  style={{
                    width: '100%', padding: '6px 10px',
                    border: `1px solid ${isEditing ? 'var(--color-primary, #2563eb)' : 'var(--color-border)'}`,
                    borderRadius: 4,
                    fontSize: 'var(--font-size-sm)', fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    background: isEditing ? '#fff' : 'var(--color-bg, #f8fafc)',
                    opacity: isEditing ? 1 : 0.6,
                    marginTop: 'auto',
                  }}
                />
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: 8, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          저장 시 AES-256-GCM으로 암호화됩니다. 저장 후에는 원본 키를 조회할 수 없습니다.
        </p>
      </div>

      {/* ── 3열: 향후 확장 영역 ── */}
      <div style={{ border: '1px dashed var(--color-border)', borderRadius: 6, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          확장 영역
        </span>
      </div>

      </div>{/* 3열 그리드 닫기 */}

      {/* ── 추가 모달 ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowAddModal(false)} />
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 8, padding: 24,
            width: 720, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text)' }}>
                API 키 추가
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px 8px' }}
              >
                &times;
              </button>
            </div>

            {/* 헤더 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 28px', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>키 이름 *</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>설정키 *</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>설명</span>
              <span />
            </div>

            {/* 행 */}
            {addRows.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 28px', gap: 8, marginBottom: 6 }}>
                <input
                  value={row.label}
                  onChange={e => updateAddRow(idx, 'label', e.target.value)}
                  placeholder="예: OpenAI API Key"
                  style={inputBase}
                />
                <input
                  value={row.key}
                  onChange={e => updateAddRow(idx, 'key', e.target.value)}
                  placeholder="예: openai.api-key"
                  style={{ ...inputBase, fontFamily: 'monospace' }}
                />
                <input
                  value={row.desc}
                  onChange={e => updateAddRow(idx, 'desc', e.target.value)}
                  placeholder="예: ChatGPT 연동"
                  style={inputBase}
                />
                <button
                  onClick={() => removeAddRow(idx)}
                  disabled={addRows.length <= 1}
                  style={{
                    width: 28, height: 28, padding: 0, border: '1px solid var(--color-border)',
                    borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 14,
                    color: addRows.length <= 1 ? '#cbd5e1' : '#ef4444',
                  }}
                >
                  &times;
                </button>
              </div>
            ))}

            {addRows.length < 5 && (
              <button
                onClick={() => setAddRows(prev => [...prev, emptyRow()])}
                style={{
                  background: 'none', border: '1px dashed var(--color-border)', borderRadius: 4,
                  padding: '6px 0', width: '100%', cursor: 'pointer', fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-primary, #2563eb)', marginTop: 4,
                }}
              >
                + 행 추가 ({addRows.length}/5)
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="mes-btn"
                style={{ padding: '5px 16px' }}
              >
                취소
              </button>
              <button
                onClick={handleAddDefs}
                className="mes-btn mes-btn-new"
                style={{ padding: '5px 16px' }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}

// Grid feature toggle definitions grouped by category
const gridFeatureGroupsDef: { label: string; features: { key: keyof GridFeatureToggles; label: string; desc: string; editOnly?: boolean }[] }[] = [
  {
    label: '표시',
    features: [
      { key: 'rowNumber', label: '순번 표시', desc: '그리드 좌측에 행 번호(No.) 컬럼을 표시합니다' },
      { key: 'columnPinning', label: '컬럼 고정', desc: '컬럼 헤더의 메뉴(☰)에서 좌/우 고정(Pin)을 설정합니다' },
      { key: 'animation', label: '행 애니메이션', desc: '행 정렬/필터 시 애니메이션 효과를 적용합니다' },
      { key: 'tooltip', label: '셀 툴팁', desc: '셀에 마우스를 올리면 전체 내용이 툴팁으로 표시됩니다' },
    ],
  },
  {
    label: '데이터',
    features: [
      { key: 'autoFormat', label: '숫자 자동 포맷', desc: '숫자 컬럼에 천단위 구분자를 자동 적용합니다' },
      { key: 'conditionalStyle', label: '조건부 스타일', desc: '숫자 컬럼에서 음수 값을 빨간색으로 표시합니다' },
      { key: 'columnFilter', label: '컬럼 필터', desc: '각 컬럼 헤더에 체크박스 필터를 표시합니다' },
    ],
  },
  {
    label: '내보내기·페이징',
    features: [
      { key: 'csvExport', label: 'CSV 내보내기', desc: '페이지네이션 바에 CSV 다운로드 버튼을 표시합니다' },
      { key: 'clientPagination', label: '클라이언트 페이징', desc: '데이터를 클라이언트에서 페이지 단위로 나누어 표시합니다', editOnly: true },
    ],
  },
];

function GridSettingsPanel() {
  const perm = usePermission('SM0040');
  const { notify } = useToast();
  const prefStore = usePreferenceStore();
  const [features, setFeatures] = useState<GridFeatureToggles>(() => prefStore.getGridFeatures());

  const groups = gridFeatureGroupsDef;

  const handleToggle = (key: keyof GridFeatureToggles) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] } as GridFeatureToggles));
  };

  const handleSave = () => {
    prefStore.setGridFeatures(features);
    notify('그리드 설정이 저장되었습니다.', { type: 'success' });
  };

  const handleReset = () => {
    setFeatures(DEFAULT_GRID_FEATURES);
    prefStore.resetGridFeatures();
    notify('그리드 설정이 초기화되었습니다.', { type: 'success' });
  };

  return (
    <div>
      <div className="grid-toolbar">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {'그리드 기능을 사용자별로 On/Off 할 수 있습니다. 저장하면 모든 페이지에 즉시 적용됩니다.'}
        </span>
        {perm.canUpdate && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleReset} className="mes-btn">
              {'초기화'}
            </button>
            <button onClick={handleSave} className="mes-btn mes-btn-save">
              {'저장'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 8 }}>
        {groups.map(group => (
          <div key={group.label} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
              {group.label}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.features.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={features[f.key] as boolean}
                      onChange={() => handleToggle(f.key)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 10,
                        background: features[f.key] ? 'var(--color-primary, #2563eb)' : '#cbd5e1',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', left: features[f.key] ? 18 : 2, top: 2,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                      }} />
                    </span>
                  </label>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text)' }}>{f.label}</span>
                      {f.editOnly && (
                        <span style={{
                          fontSize: '10px', padding: '1px 5px', borderRadius: 3,
                          background: '#e0f2fe', color: '#0369a1',
                        }}>
                          {'EditGrid 전용'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 합계 행 타입 선택 */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
          <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
            {'합계 행'}
          </h4>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
            {'숫자 컬럼의 합계를 표시하는 방식을 선택합니다'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['off', 'pinned', 'inline'] as const).map(opt => {
              const labels: Record<string, string> = { off: '미사용', pinned: '하단 고정', inline: '리스트 하단' };
              return (
                <button
                  key={opt}
                  onClick={() => setFeatures(prev => ({ ...prev, totalRowType: opt }))}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 4,
                    border: features.totalRowType === opt ? '2px solid var(--color-primary, #2563eb)' : '1px solid var(--color-border, #e2e8f0)',
                    background: features.totalRowType === opt ? 'var(--color-primary, #2563eb)' : 'var(--color-bg-white, #fff)',
                    color: features.totalRowType === opt ? '#fff' : 'var(--color-text, #1e293b)',
                    fontWeight: features.totalRowType === opt ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {labels[opt]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const OCR_MODELS = [
  { value: 'claude-sonnet', label: 'Claude Sonnet', desc: '성능과 비용의 균형 (권장)', price: '$3 / $15 per 1M tokens' },
  { value: 'claude-opus', label: 'Claude Opus', desc: '최고 성능, 복잡한 문서 분석에 적합', price: '$15 / $75 per 1M tokens' },
  { value: 'claude-haiku', label: 'Claude Haiku', desc: '빠른 속도, 저비용', price: '$0.80 / $4 per 1M tokens' },
] as const;

const EMAIL_RE = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const HOST_RE = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;

function validateMailForm(form: { host: string; port: string; fromAddress: string; username: string }) {
  const errors: Record<string, string> = {};
  if (form.host && !HOST_RE.test(form.host)) errors.host = '올바른 호스트명을 입력하세요.';
  if (form.port) {
    const p = Number(form.port);
    if (isNaN(p) || p < 1 || p > 65535) errors.port = '포트는 1~65535 범위여야 합니다.';
  }
  if (form.fromAddress && !EMAIL_RE.test(form.fromAddress)) errors.fromAddress = '올바른 이메일 형식을 입력하세요.';
  if (form.username && !EMAIL_RE.test(form.username)) errors.username = '올바른 이메일 형식을 입력하세요.';
  return errors;
}

function MailSettingsPanel() {
  const perm = usePermission('SM0040');
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    enabled: 'false',
    host: '',
    port: '25',
    username: '',
    password: '',
    smtpAuth: 'false',
    starttls: 'false',
    fromAddress: 'noreply@peakmate.local',
    fromName: 'PeakMate',
  });

  useEffect(() => {
    api.get('/system/settings/mail')
      .then((res) => {
        const data = (res.data ?? {}) as Record<string, string>;
        setForm(prev => ({ ...prev, ...data }));
      })
      .catch(() => notify('메일 설정 조회 실패', { type: 'error' }))
      .finally(() => setLoading(false));
  }, [notify]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      setFieldErrors(validateMailForm(next));
      return next;
    });
  };

  const handleToggle = (key: string) => {
    setForm(prev => ({ ...prev, [key]: prev[key as keyof typeof prev] === 'true' ? 'false' : 'true' }));
  };

  const handleSave = async () => {
    const errors = validateMailForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      notify('입력값을 확인해주세요.', { type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/system/settings/mail', form);
      notify('메일 설정이 저장되었습니다.', { type: 'success' });
    } catch {
      notify('메일 설정 저장에 실패했습니다.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post<MailTestResult>('/system/settings/mail/test-connection');
      if (res.success === false) {
        notify(res.message || '연결 테스트 실패', { type: 'error' });
      } else {
        const data = res.data;
        notify(data?.message || (data?.success ? '연결 성공' : '연결 실패'), { type: data?.success ? 'success' : 'error' });
      }
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : '연결 테스트 실패', { type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail.trim()) {
      notify('수신자 이메일 주소를 입력하세요.', { type: 'warning' });
      return;
    }
    if (!EMAIL_RE.test(testEmail.trim())) {
      notify('올바른 이메일 형식을 입력하세요.', { type: 'warning' });
      return;
    }
    setSendingTest(true);
    try {
      const res = await api.post<MailTestResult>('/system/settings/mail/test-send', { to: testEmail });
      if (res.success === false) {
        notify(res.message || '테스트 메일 발송 실패', { type: 'error' });
      } else {
        notify(res.data?.message || '테스트 메일 발송 완료', { type: 'success' });
      }
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : '테스트 메일 발송 실패', { type: 'error' });
    } finally {
      setSendingTest(false);
    }
  };

  const inputStyle = (field?: string): React.CSSProperties => ({
    width: '100%', padding: '6px 10px',
    border: `1px solid ${field && fieldErrors[field] ? '#ef4444' : 'var(--color-border)'}`, borderRadius: 4,
    fontSize: 'var(--font-size-sm)', boxSizing: 'border-box',
  });

  const errorMsgStyle: React.CSSProperties = {
    fontSize: 11, color: '#ef4444', marginTop: 2,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500,
    color: 'var(--color-text)', marginBottom: 4,
  };

  if (loading) return <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>로딩 중...</span>;

  return (
    <div style={{ maxWidth: 720, padding: 16 }}>
      {/* 활성화 토글 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 8,
        }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            메일 발송 설정
          </h3>
          {perm.canUpdate && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleTestConnection} disabled={testing} className="mes-btn" style={{ fontSize: 11, padding: '3px 12px' }}>
                {testing ? '테스트 중...' : '연결 테스트'}
              </button>
              <button onClick={handleSave} disabled={saving} className="mes-btn mes-btn-save" style={{ fontSize: 11, padding: '3px 12px' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'var(--color-bg, #f8fafc)',
          border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>
              메일 발송 기능
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {form.enabled === 'true'
                ? 'ON — 비밀번호 초기화, 알림 등 메일 발송이 활성화됩니다.'
                : 'OFF — 메일 발송이 비활성화됩니다. 비밀번호 초기화 시 임시 비밀번호가 화면에 표시됩니다.'}
            </div>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            disabled={!perm.canUpdate}
            style={{
              padding: '6px 16px', borderRadius: 4, border: 'none', cursor: perm.canUpdate ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', fontWeight: 600, flexShrink: 0, marginLeft: 16,
              background: form.enabled === 'true' ? '#16a34a' : '#e5e7eb',
              color: form.enabled === 'true' ? '#fff' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            {form.enabled === 'true' ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* SMTP 서버 설정 */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
          SMTP 서버 설정
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>SMTP 호스트</label>
            <input
              value={form.host}
              onChange={e => handleChange('host', e.target.value)}
              placeholder="예: smtp.gmail.com"
              style={inputStyle('host')}
            />
            {fieldErrors.host && <div style={errorMsgStyle}>{fieldErrors.host}</div>}
          </div>
          <div>
            <label style={labelStyle}>포트</label>
            <input
              value={form.port}
              onChange={e => handleChange('port', e.target.value)}
              placeholder="예: 587"
              style={inputStyle('port')}
            />
            {fieldErrors.port && <div style={errorMsgStyle}>{fieldErrors.port}</div>}
          </div>
          <div>
            <label style={labelStyle}>인증 계정</label>
            <input
              value={form.username}
              onChange={e => handleChange('username', e.target.value)}
              placeholder="예: user@gmail.com"
              style={inputStyle('username')}
            />
            {fieldErrors.username && <div style={errorMsgStyle}>{fieldErrors.username}</div>}
          </div>
          <div>
            <label style={labelStyle}>인증 비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="앱 비밀번호 또는 SMTP 비밀번호"
              style={inputStyle()}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={form.smtpAuth === 'true'}
                onChange={() => handleToggle('smtpAuth')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 10,
                background: form.smtpAuth === 'true' ? 'var(--color-primary, #2563eb)' : '#cbd5e1',
                transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', left: form.smtpAuth === 'true' ? 18 : 2, top: 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </span>
            </label>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>SMTP 인증</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={form.starttls === 'true'}
                onChange={() => handleToggle('starttls')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 10,
                background: form.starttls === 'true' ? 'var(--color-primary, #2563eb)' : '#cbd5e1',
                transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', left: form.starttls === 'true' ? 18 : 2, top: 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </span>
            </label>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>STARTTLS 암호화</span>
          </div>
        </div>
      </div>

      {/* 발신자 설정 */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
          발신자 설정
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>발신자 이메일</label>
            <input
              value={form.fromAddress}
              onChange={e => handleChange('fromAddress', e.target.value)}
              placeholder="예: noreply@company.com"
              style={inputStyle('fromAddress')}
            />
            {fieldErrors.fromAddress && <div style={errorMsgStyle}>{fieldErrors.fromAddress}</div>}
          </div>
          <div>
            <label style={labelStyle}>발신자 이름</label>
            <input
              value={form.fromName}
              onChange={e => handleChange('fromName', e.target.value)}
              placeholder="예: PeakMate"
              style={inputStyle()}
            />
          </div>
        </div>
      </div>

      {/* 테스트 메일 발송 */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
          테스트 메일 발송
        </h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>수신자 이메일</label>
            <input
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="테스트 수신할 이메일 주소"
              style={{
                ...inputStyle(),
                ...(testEmail && !EMAIL_RE.test(testEmail) ? { borderColor: '#ef4444' } : {}),
              }}
            />
            {testEmail && !EMAIL_RE.test(testEmail) && <div style={errorMsgStyle}>올바른 이메일 형식을 입력하세요.</div>}
          </div>
          <button
            onClick={handleTestSend}
            disabled={sendingTest || !testEmail.trim()}
            className="mes-btn mes-btn-new"
            style={{ fontSize: 11, padding: '6px 16px', whiteSpace: 'nowrap' }}
          >
            {sendingTest ? '발송 중...' : '테스트 발송'}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div style={{
        padding: 10, borderRadius: 6, background: 'var(--color-bg, #f8fafc)',
        border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)', lineHeight: 1.6,
      }}>
        <strong>개발 환경:</strong> Gmail SMTP — smtp.gmail.com:587, SMTP 인증 ON, STARTTLS ON, 앱 비밀번호 사용<br/>
        <strong>운영 환경:</strong> 고객사 메일 서버 — 사내 SMTP 호스트:포트, 인증 정보는 고객사 제공<br/>
        <strong>앱 비밀번호:</strong>{' '}
        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-primary, #2563eb)' }}>
          Google 앱 비밀번호 생성
        </a>
        {' '}— Google 계정 → 2단계 인증 활성화 → 앱 비밀번호 → 앱 이름 입력 → 생성된 16자리를 인증 비밀번호에 입력
      </div>
    </div>
  );
}

function ConditionSettingsPanel() {
  const perm = usePermission('SM0040');
  const { notify } = useToast();
  const prefStore = usePreferenceStore();
  const [features, setFeatures] = useState<GridFeatureToggles>(() => prefStore.getGridFeatures());
  const [ocrModel, setOcrModel] = useState<string>(() => {
    try { return localStorage.getItem('pm-ocr-model') || 'claude-sonnet'; }
    catch { return 'claude-sonnet'; }
  });

  const handleSave = () => {
    prefStore.setGridFeatures(features);
    localStorage.setItem('pm-ocr-model', ocrModel);
    notify('조건설정이 저장되었습니다.', { type: 'success' });
  };

  const handleReset = () => {
    setFeatures(prev => ({ ...prev, searchMode: DEFAULT_GRID_FEATURES.searchMode }));
    const current = prefStore.getGridFeatures();
    prefStore.setGridFeatures({ ...current, searchMode: DEFAULT_GRID_FEATURES.searchMode });
    setOcrModel('claude-sonnet');
    localStorage.setItem('pm-ocr-model', 'claude-sonnet');
    notify('조건설정이 초기화되었습니다.', { type: 'success' });
  };

  return (
    <div>
      <div className="grid-toolbar">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {'검색 조건의 동작 방식을 설정합니다.'}
        </span>
        {perm.canUpdate && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleReset} className="mes-btn">
              {'초기화'}
            </button>
            <button onClick={handleSave} className="mes-btn mes-btn-save">
              {'저장'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 8 }}>
        {/* 검색 모드 */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
          <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
            {'서버 검색 방식'}
          </h4>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
            {'PeakDataGrid의 서버 검색 입력 방식을 선택합니다'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['debounce', 'button'] as const).map(opt => {
              const labels: Record<string, string> = { debounce: '디바운스(자동)', button: '조회 버튼' };
              return (
                <button
                  key={opt}
                  onClick={() => setFeatures(prev => ({ ...prev, searchMode: opt }))}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 4,
                    border: features.searchMode === opt ? '2px solid var(--color-primary, #2563eb)' : '1px solid var(--color-border, #e2e8f0)',
                    background: features.searchMode === opt ? 'var(--color-primary, #2563eb)' : 'var(--color-bg-white, #fff)',
                    color: features.searchMode === opt ? '#fff' : 'var(--color-text, #1e293b)',
                    fontWeight: features.searchMode === opt ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {labels[opt]}
                </button>
              );
            })}
          </div>
        </div>

        {/* OCR 모델 선택 */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
          <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
            OCR 모델 선택
          </h4>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 10 }}>
            영수증/문서 OCR 분석에 사용할 Claude 모델을 선택합니다.
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OCR_MODELS.map(m => (
              <label
                key={m.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: ocrModel === m.value
                    ? '2px solid var(--color-primary, #2563eb)'
                    : '1px solid var(--color-border, #e2e8f0)',
                  background: ocrModel === m.value ? '#eff6ff' : 'var(--color-bg-white, #fff)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="ocrModel"
                  value={m.value}
                  checked={ocrModel === m.value}
                  onChange={e => setOcrModel(e.target.value)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                      {m.label}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 3,
                      background: m.value === 'claude-sonnet' ? '#dbeafe' : m.value === 'claude-opus' ? '#fce7f3' : '#d1fae5',
                      color: m.value === 'claude-sonnet' ? '#1d4ed8' : m.value === 'claude-opus' ? '#be185d' : '#047857',
                    }}>
                      {m.price}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {m.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const tabs = useMemo(() => [
    { key: 'security', label: '보안 설정' },
    { key: 'mail', label: '메일 설정' },
    { key: 'grid', label: '그리드 설정' },
    { key: 'condition', label: '조건설정' },
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>
      <TabPanel tabs={tabs} storageKey="system-settings-tab">
        {(activeTab) => {
          if (activeTab === 'security') return <SecuritySettingsPanel />;
          if (activeTab === 'mail') return <MailSettingsPanel />;
          if (activeTab === 'grid') return <GridSettingsPanel />;
          return <ConditionSettingsPanel />;
        }}
      </TabPanel>
    </div>
  );
}
