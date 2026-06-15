import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useCommonCodes, type CommonCode } from '@/hooks/useCommonCodes';

interface TechInfo {
  id?: number;
  equipCategoryCode: string;
  mtbfTargetMin?: number;
  mtbfUclMin?: number;
  mtbfLossTypeCodes?: string;
  mttrTargetMin?: number;
  mttrUclMin?: number;
  mttrLossTypeCodes?: string;
}

export default function EquipTechInfoPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0090');
  const { notify } = useToast();
  const codes = useCommonCodes('EQUIP_CATEGORY', 'EQUIP_FAIL_TYPE');
  const equipCategories = useMemo(() => codes['EQUIP_CATEGORY'] ?? [], [codes]);
  const failTypes = useMemo(() => codes['EQUIP_FAIL_TYPE'] ?? [], [codes]);

  const [infoList, setInfoList] = useState<TechInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [form, setForm] = useState<TechInfo>({
    equipCategoryCode: '',
    mtbfTargetMin: 480,
    mtbfUclMin: 720,
    mttrTargetMin: 30,
    mttrUclMin: 60,
  });

  const fetchInfo = useCallback(async () => {
    try {
      const res = await authFetch('/api/et/tech-info');
      if (res.ok) {
        const json = await res.json();
        setInfoList(json.data || []);
      }
    } catch {
      notify(t('message.networkError', '설비기술기준정보 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  useEffect(() => {
    if (!selectedCategory) return;
    const found = infoList.find(i => i.equipCategoryCode === selectedCategory);
    if (found) {
      setForm({ ...found });
    } else {
      setForm({
        equipCategoryCode: selectedCategory,
        mtbfTargetMin: 480,
        mtbfUclMin: 720,
        mttrTargetMin: 30,
        mttrUclMin: 60,
      });
    }
  }, [selectedCategory, infoList]);

  const handleSave = useCallback(async () => {
    if (!form.equipCategoryCode) {
      notify('설비 카테고리를 선택해주세요', { type: 'error' });
      return;
    }
    try {
      const res = await authFetch('/api/et/tech-info/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '저장에 실패했습니다');
      }
      notify(t('message.saveSuccess', '설비기술기준정보를 저장했습니다'), { type: 'success' });
      await fetchInfo();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '저장에 실패했습니다'), { type: 'error' });
    }
  }, [form, fetchInfo, notify, t]);

  const toggleLossType = (field: 'mtbfLossTypeCodes' | 'mttrLossTypeCodes', code: string) => {
    setForm(prev => {
      const current = (prev[field] || '').split(',').filter(Boolean);
      const updated = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code];
      return { ...prev, [field]: updated.join(',') };
    });
  };

  const isLossTypeSelected = (field: 'mtbfLossTypeCodes' | 'mttrLossTypeCodes', code: string): boolean => {
    return (form[field] || '').split(',').includes(code);
  };

  const getCategoryLabel = (code: string): string => {
    const found = equipCategories.find((c: CommonCode) => c.code === code);
    return found ? `${found.codeName} (${code})` : code;
  };

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 13, width: 100,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, color: 'var(--color-text-disabled)', marginRight: 8,
  };
  const sectionStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)', borderRadius: 6,
    padding: 16, marginBottom: 16,
  };

  return (
    <PageFilterShell
      title={t('menu.ET0090')}
      toolbar={
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="">-- 설비 카테고리 선택 --</option>
          {equipCategories.map((c: CommonCode) => (
            <option key={c.code} value={c.code}>{c.codeName} ({c.code})</option>
          ))}
        </select>
      }
      toolbarRight={perm.canUpdate && selectedCategory ? (
        <button className="mes-btn mes-btn-save" onClick={handleSave}>저장</button>
      ) : undefined}
    >
      {selectedCategory ? (
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {/* MTBF 관리 기준 */}
          <div style={sectionStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 700 }}>MTBF 관리 기준</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={labelStyle}>목표 시간(분)</span>
                <input
                  type="number"
                  value={form.mtbfTargetMin ?? ''}
                  disabled={!perm.canUpdate}
                  onChange={e => setForm(f => ({ ...f, mtbfTargetMin: e.target.value ? +e.target.value : 0 }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>관리 상한선(UCL, 분)</span>
                <input
                  type="number"
                  value={form.mtbfUclMin ?? ''}
                  disabled={!perm.canUpdate}
                  onChange={e => setForm(f => ({ ...f, mtbfUclMin: e.target.value ? +e.target.value : 0 }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <span style={labelStyle}>집계 포함 고장유형</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {failTypes.map((c: CommonCode) => (
                  <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: perm.canUpdate ? 'pointer' : 'default' }}>
                    <input
                      type="checkbox"
                      checked={isLossTypeSelected('mtbfLossTypeCodes', c.code)}
                      disabled={!perm.canUpdate}
                      onChange={() => toggleLossType('mtbfLossTypeCodes', c.code)}
                    />
                    {c.codeName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* MTTR 관리 기준 */}
          <div style={sectionStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 700 }}>MTTR 관리 기준</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={labelStyle}>목표 시간(분)</span>
                <input
                  type="number"
                  value={form.mttrTargetMin ?? ''}
                  disabled={!perm.canUpdate}
                  onChange={e => setForm(f => ({ ...f, mttrTargetMin: e.target.value ? +e.target.value : 0 }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>관리 상한선(UCL, 분)</span>
                <input
                  type="number"
                  value={form.mttrUclMin ?? ''}
                  disabled={!perm.canUpdate}
                  onChange={e => setForm(f => ({ ...f, mttrUclMin: e.target.value ? +e.target.value : 0 }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <span style={labelStyle}>집계 포함 고장유형</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {failTypes.map((c: CommonCode) => (
                  <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: perm.canUpdate ? 'pointer' : 'default' }}>
                    <input
                      type="checkbox"
                      checked={isLossTypeSelected('mttrLossTypeCodes', c.code)}
                      disabled={!perm.canUpdate}
                      onChange={() => toggleLossType('mttrLossTypeCodes', c.code)}
                    />
                    {c.codeName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 현재 설정 현황 */}
          <div style={sectionStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 700 }}>설비 카테고리별 설정 현황</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--grid-header-bg, #f0f4f8)' }}>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>카테고리</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>MTBF 목표(분)</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>MTBF UCL(분)</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>MTTR 목표(분)</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>MTTR UCL(분)</th>
                </tr>
              </thead>
              <tbody>
                {infoList.map(info => (
                  <tr
                    key={info.equipCategoryCode}
                    onClick={() => setSelectedCategory(info.equipCategoryCode)}
                    style={{
                      cursor: 'pointer',
                      background: info.equipCategoryCode === selectedCategory ? 'var(--grid-row-selected, #e8f0fe)' : undefined,
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>{getCategoryLabel(info.equipCategoryCode)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{info.mtbfTargetMin}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{info.mtbfUclMin}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{info.mttrTargetMin}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{info.mttrUclMin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-disabled)' }}>
          상단에서 설비 카테고리를 선택하세요
        </div>
      )}
    </PageFilterShell>
  );
}
