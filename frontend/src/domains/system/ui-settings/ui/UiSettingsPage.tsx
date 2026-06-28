import { useState, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PageTitle } from '@/components/ui/PageTitle';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import type { GlassConfig } from '@/stores/usePreferenceStore';
import { useToast } from '@/shared/components/toast/useToast';
import { hexToGlassGradient } from '@/lib/glassUtils';

// CSS customizable variable definitions
const cssVarGroupsDef = [
  {
    label: '레이아웃',
    vars: [
      { key: '--sidebar-width', label: '사이드바 너비', default: '230px', type: 'text' },
      { key: '--header-height', label: '헤더 높이', default: '44px', type: 'text' },
      { key: '--content-padding', label: '본문 여백', default: '16px', type: 'text' },
    ],
  },
  {
    label: '폰트',
    vars: [
      { key: '--font-size-sm', label: '작은 글자 (SM)', default: '12px', type: 'text' },
      { key: '--font-size-base', label: '기본 글자 (BASE)', default: '13px', type: 'text' },
      { key: '--font-size-md', label: '중간 글자 (MD)', default: '15px', type: 'text' },
      { key: '--font-size-lg', label: '큰 글자 (LG)', default: '17px', type: 'text' },
      { key: '--font-size-xl', label: '아주 큰 글자 (XL)', default: '20px', type: 'text' },
      { key: '--font-size-xxl', label: '특대 글자 (XXL)', default: '24px', type: 'text' },
    ],
  },
  {
    label: '색상',
    vars: [
      { key: '--color-text', label: '본문 글자', default: '#1e293b', type: 'color' },
      { key: '--color-text-secondary', label: '보조 글자', default: '#64748b', type: 'color' },
      { key: '--color-bg', label: '배경', default: '#f8fafc', type: 'color' },
      { key: '--color-bg-white', label: '카드 배경', default: '#ffffff', type: 'color' },
      { key: '--color-border', label: '테두리', default: '#e2e8f0', type: 'color' },
      { key: '--color-primary', label: '강조색', default: '#2563eb', type: 'color' },
    ],
  },
  {
    label: '그리드',
    vars: [
      { key: '--grid-header-bg', label: '헤더 배경', default: '#f1f5f9', type: 'color' },
      { key: '--grid-header-text', label: '헤더 글자', default: '#334155', type: 'color' },
      { key: '--grid-header-font-size', label: '헤더 글자크기', default: '12px', type: 'text' },
      { key: '--grid-header-height', label: '헤더 높이', default: '29px', type: 'text' },
      { key: '--grid-row-height', label: '행 높이', default: '25px', type: 'text' },
      { key: '--grid-font-size', label: '그리드 글자 크기', default: '12px', type: 'text' },
      { key: '--grid-row-hover', label: '행 호버 배경', default: '#f1f5f9', type: 'color' },
    ],
  },
  {
    label: '사이드바',
    vars: [
      { key: '--sidebar-bg', label: '사이드바 배경', default: '#1e293b', type: 'color' },
      { key: '--sidebar-text', label: '사이드바 글자', default: '#d9d9d9', type: 'color' },
      { key: '--sidebar-text-active', label: '활성 글자', default: '#ffffff', type: 'color' },
      { key: '--sidebar-active-bg', label: '활성 배경', default: '#264a3a', type: 'color' },
      { key: '--sidebar-title-font-size', label: '타이틀 글자 크기', default: '20px', type: 'text' },
      { key: '--sidebar-font-size', label: '메뉴 글자 크기', default: '15px', type: 'text' },
      { key: '--sidebar-child-font-size', label: '하위메뉴 글자 크기', default: '13px', type: 'text' },
    ],
  },
];

// 버튼 CSS 변수 정의
const btnVarsDef = [
  {
    groupKey: 'search',
    label: '조회 버튼',
    vars: [
      { key: '--btn-search-bg', label: '배경색', default: '#2563eb', type: 'color' },
      { key: '--btn-search-text', label: '글자색', default: '#ffffff', type: 'color' },
      { key: '--btn-search-border', label: '라인색', default: '#2563eb', type: 'color' },
    ],
  },
  {
    groupKey: 'new',
    label: '신규 버튼',
    vars: [
      { key: '--btn-new-bg', label: '배경색', default: '#00364a', type: 'color' },
      { key: '--btn-new-text', label: '글자색', default: '#ffffff', type: 'color' },
      { key: '--btn-new-border', label: '라인색', default: '#00364a', type: 'color' },
    ],
  },
  {
    groupKey: 'save',
    label: '저장 버튼',
    vars: [
      { key: '--btn-save-bg', label: '배경색', default: '#4f7a28', type: 'color' },
      { key: '--btn-save-text', label: '글자색', default: '#ffffff', type: 'color' },
      { key: '--btn-save-border', label: '라인색', default: '#4f7a28', type: 'color' },
    ],
  },
  {
    groupKey: 'delete',
    label: '삭제 버튼',
    vars: [
      { key: '--btn-delete-bg', label: '배경색', default: '#ffffff', type: 'color' },
      { key: '--btn-delete-text', label: '글자색', default: '#ef4444', type: 'color' },
      { key: '--btn-delete-border', label: '라인색', default: '#fca5a5', type: 'color' },
    ],
  },
  {
    groupKey: 'edit',
    label: '수정 버튼',
    vars: [
      { key: '--btn-edit-bg', label: '배경색', default: '#ffffff', type: 'color' },
      { key: '--btn-edit-text', label: '글자색', default: '#2563eb', type: 'color' },
      { key: '--btn-edit-border', label: '라인색', default: '#93c5fd', type: 'color' },
    ],
  },
];

const btnVarKeys = btnVarsDef.flatMap(g => g.vars.map(v => v.key));

// 글래스모피즘 프리셋 색상
const GLASS_PRESETS = [
  { key: 'none', label: '적용안함', color: '' },
  { key: 'blue', label: '청색', color: '#1e3a5f' },
  { key: 'green', label: '녹색', color: '#064e3b' },
  { key: 'brown', label: '갈색', color: '#5c3317' },
  { key: 'purple', label: '보라', color: '#4c1d95' },
  { key: 'slate', label: '회색', color: '#334155' },
] as const;

type GlassTarget = 'sidebar' | 'login';

function applyCssVarsToDOM(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    if (value) root.style.setProperty(key, value);
  }
}

export default function UiSettingsPage() {
  const perm = usePermission('SM0080');
  const { notify } = useToast();
  const prefStore = usePreferenceStore();
  const [vars, setVars] = useState<Record<string, string>>(() => prefStore.getCssVars());
  const [btnVars, setBtnVars] = useState<Record<string, string>>(() => {
    const all = prefStore.getCssVars();
    const picked: Record<string, string> = {};
    for (const k of btnVarKeys) { if (all[k]) picked[k] = all[k]; }
    return picked;
  });
  const [glass, setGlass] = useState<GlassConfig>(() => prefStore.getGlass());
  const [workingLabel, setWorkingLabel] = useState(() => prefStore.getWorkingLabel());

  const cssVarGroups = cssVarGroupsDef;

  const btnGroups = useMemo(() =>
    btnVarsDef.map(g => ({
      groupKey: g.groupKey,
      label: g.label,
      vars: g.vars,
    })),
    [],
  );

  const handleChange = (key: string, value: string) => {
    setVars(prev => {
      const next = { ...prev, [key]: value };
      document.documentElement.style.setProperty(key, value);
      return next;
    });
  };

  const handleBtnVarChange = (key: string, value: string) => {
    setBtnVars(prev => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(key, value);
  };

  const handleBtnVarReset = (key: string) => {
    const def = btnVarsDef.flatMap(g => g.vars).find(v => v.key === key);
    const defaultVal = def?.default || '';
    document.documentElement.style.setProperty(key, defaultVal);
    setBtnVars(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // vars에도 남아있는 이전 값 제거 (저장 시 병합되지 않도록)
    setVars(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleGlassChange = (target: GlassTarget, color: string) => {
    const next = { ...glass, [target]: color };
    setGlass(next);
    // 즉시 store에 반영 → AppLayout/LoginPage 즉시 반응
    prefStore.setGlass(next);
  };

  const handleSave = () => {
    const merged = { ...vars, ...btnVars };
    prefStore.setCssVars(merged);
    prefStore.setGlass(glass);
    applyCssVarsToDOM(merged);
    notify('CSS 설정이 저장되었습니다.', { type: 'success' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="grid-toolbar">
        <PageTitle />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
        <div className="grid-toolbar">
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {'레이아웃, 폰트, 색상, 그리드, 사이드바, 버튼 스타일을 개인 취향에 맞게 설정할 수 있습니다. ↺ 버튼 클릭 시 기본값으로 복원됩니다.'}
          </span>
          {perm.canUpdate && (
            <button
              onClick={handleSave}
              className="mes-btn mes-btn-save"
            >
              {'저장'}
            </button>
          )}
        </div>

        {/* 글래스모피즘 설정 */}
        <div style={{ border: '2px solid var(--color-primary)', borderRadius: 8, padding: 16, marginTop: 8, background: 'var(--color-bg-white)' }}>
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: 4, color: 'var(--color-text)' }}>
            {'글래스모피즘'}
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            {'사이드바와 로그인 화면에 글래스모피즘(반투명 블러) 효과를 적용합니다. 기존 배경색 설정보다 우선 적용됩니다.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['sidebar', 'login'] as GlassTarget[]).map(target => {
              const currentColor = glass[target];
              const isNone = currentColor === 'none';
              const isCustom = !isNone && !GLASS_PRESETS.some(p => p.color === currentColor);
              return (
                <div key={target} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', width: 100, flexShrink: 0 }}>
                    {target === 'sidebar' ? '사이드바' : '로그인 배경'}
                  </label>
                  {GLASS_PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      onClick={() => handleGlassChange(target, preset.key === 'none' ? 'none' : preset.color)}
                      style={{
                        padding: '4px 12px',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: (preset.key === 'none' ? isNone : currentColor === preset.color)
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: preset.key === 'none'
                          ? 'var(--color-bg-white)'
                          : hexToGlassGradient(preset.color),
                        color: preset.key === 'none' ? 'var(--color-text)' : '#fff',
                        fontWeight: (preset.key === 'none' ? isNone : currentColor === preset.color) ? 600 : 400,
                        minWidth: 64,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {/* 커스텀 색상 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="color"
                      value={isNone ? '#334155' : currentColor}
                      onChange={e => handleGlassChange(target, e.target.value)}
                      style={{
                        width: 28, height: 24, padding: 0,
                        border: isCustom ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: 3, cursor: 'pointer', flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{'커스텀'}</span>
                  </div>
                  {/* 미리보기 */}
                  {!isNone && (
                    <div
                      style={{
                        width: 80, height: 28, borderRadius: 6,
                        background: hexToGlassGradient(currentColor),
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 500,
                      }}
                    >
                      {'미리보기'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 로딩 인디케이터 설정 */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 16, marginTop: 8, background: 'var(--color-bg-white)' }}>
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: 4, color: 'var(--color-text)' }}>
            {'로딩 인디케이터'}
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            {'API 처리 중 화면 중앙에 표시되는 텍스트를 설정합니다. 최대 20자.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              value={workingLabel}
              maxLength={20}
              onChange={e => {
                const val = e.target.value;
                setWorkingLabel(val);
                prefStore.setWorkingLabel(val);
              }}
              style={{
                fontSize: 'var(--font-size-base)', padding: '4px 10px',
                border: '1px solid var(--color-border)', borderRadius: 4,
                width: 220, height: 30,
              }}
              placeholder="I'm working"
            />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {workingLabel.length} / 20
            </span>
            <button
              className="mes-btn"
              onClick={() => {
                setWorkingLabel("I'm working");
                prefStore.setWorkingLabel("I'm working");
              }}
            >
              {'기본값'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 8 }}>
          {cssVarGroups.map(group => (
            <div key={group.label} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
                {group.label}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.vars.map(v => {
                  const currentVal = vars[v.key] || '';
                  const isModified = currentVal !== '' && currentVal !== v.default;
                  return (
                    <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', width: 120, flexShrink: 0 }}>
                        {v.label}
                      </label>
                      {v.type === 'color' ? (
                        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
                          <input
                            type="color"
                            value={currentVal || v.default}
                            onChange={e => handleChange(v.key, e.target.value)}
                            style={{ width: 28, height: 24, padding: 0, border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', flexShrink: 0 }}
                          />
                          <input
                            type="text"
                            value={currentVal || v.default}
                            onChange={e => handleChange(v.key, e.target.value)}
                            placeholder={v.default}
                            style={{ flex: 1, minWidth: 0, fontSize: 'var(--font-size-sm)', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 3, height: 24 }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentVal || v.default}
                          onChange={e => handleChange(v.key, e.target.value)}
                          placeholder={v.default}
                          style={{ flex: 1, minWidth: 0, fontSize: 'var(--font-size-sm)', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 3, height: 24 }}
                        />
                      )}
                      <button
                        onClick={() => { document.documentElement.style.setProperty(v.key, v.default); setVars(prev => { const next = { ...prev }; delete next[v.key]; return next; }); }}
                        className="mes-btn"
                        style={{ padding: '1px 6px', fontSize: 10, flexShrink: 0, opacity: isModified ? 1 : 0.3 }}
                        title={v.default}
                      >
                        ↺
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 버튼 스타일 설정 */}
          {btnGroups.map(group => (
            <div key={group.groupKey} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  {group.label}
                </h4>
                <button
                  className={`mes-btn ${group.groupKey === 'search' ? 'mes-btn-search' : group.groupKey === 'new' ? 'mes-btn-new' : group.groupKey === 'save' ? 'mes-btn-save' : group.groupKey === 'delete' ? 'mes-btn-delete' : 'mes-btn-edit'}`}
                  style={{ pointerEvents: 'none', fontSize: 11 }}
                >
                  {'버튼 스타일'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.vars.map(v => {
                  const currentVal = btnVars[v.key] || '';
                  const isModified = currentVal !== '' && currentVal !== v.default;
                  return (
                    <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', width: 50, flexShrink: 0 }}>
                        {v.label}
                      </label>
                      <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
                        <input
                          type="color"
                          value={currentVal || v.default}
                          onChange={e => handleBtnVarChange(v.key, e.target.value)}
                          style={{ width: 28, height: 24, padding: 0, border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <input
                          type="text"
                          value={currentVal || v.default}
                          onChange={e => handleBtnVarChange(v.key, e.target.value)}
                          placeholder={v.default}
                          style={{ flex: 1, minWidth: 0, fontSize: 'var(--font-size-sm)', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 3, height: 24 }}
                        />
                      </div>
                      <button
                        onClick={() => handleBtnVarReset(v.key)}
                        className="mes-btn"
                        style={{ padding: '1px 6px', fontSize: 10, flexShrink: 0, opacity: isModified ? 1 : 0.3 }}
                        title={v.default}
                      >
                        ↺
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
