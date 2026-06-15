import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useCommonCodes } from '@/hooks/useCommonCodes';

/* ── 날짜 유틸 ── */

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}


function calcEndTime(startTime: string, stdTimeH: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(stdTimeH * 60);
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

const DOW_KO = ['월', '화', '수', '목', '금', '토', '일'];

/* ── 이벤트 chip 색상 ── */

const EVENT_COLORS: Record<string, string> = {
  PM:         '#3b82f6',
  BM:         '#ef4444',
  PD:         '#f59e0b',
  MAT_CHANGE: '#22c55e',
  TACT_DELAY: '#f97316',
  OTHER:      '#64748b',
};

/* ── 이벤트유형별 내용 선택지 ── */

const EVENT_CONTENT_OPTIONS: Record<string, string[]> = {
  PM:         ['설비점검', '오일교체', '벨트교체', '필터교체', '그리스 주입', '예방보전 작업'],
  BM:         ['긴급수리', '부품교체', '전기계통 이상', '기계계통 이상', '누액 수리'],
  PD:         ['계획휴지', '자재대기', '공정조정', '라인전환', '정기청소'],
  MAT_CHANGE: ['원재료 교체', '소모품 교체', '지그 교체', '치공구 교체'],
  TACT_DELAY: ['속도저하', '사이클타임 초과', '품질불량 재작업'],
  OTHER:      [],
};

/* ── 타입 ── */

interface OperationPlanRow {
  id?: number;
  equipId?: number;
  planDate?: string;
  eventTypeCode?: string;
  eventContent?: string;
  stdTimeH?: number;
  startTime?: string;
  endTime?: string;
  availTimeH?: number;
  remark?: string;
}

interface EquipItem { id: number; label: string }

const DEFAULT_START = '08:00';

const emptyForm = (equipId?: number, planDate?: string): OperationPlanRow => ({
  equipId,
  planDate: planDate ?? new Date().toISOString().split('T')[0],
  startTime: DEFAULT_START,
  availTimeH: 24,
});

export default function EquipOperationPlanPage() {
  const { t } = useTranslation();
  const perm = usePermission('ET0110');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const codes = useCommonCodes('EQUIP_PLAN_EVENT');
  const planEventTypes = useMemo(() => codes['EQUIP_PLAN_EVENT'] ?? [], [codes]);

  const [rows, setRows] = useState<OperationPlanRow[]>([]);
  const [equipList, setEquipList] = useState<EquipItem[]>([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [weekEnd, setWeekEnd] = useState(() => addDays(getMonday(new Date()), 6));
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<OperationPlanRow>(emptyForm());
  const [isNew, setIsNew] = useState(true);

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    let cur = weekStart;
    while (cur <= weekEnd && dates.length < 31) {
      dates.push(cur);
      cur = addDays(cur, 1);
    }
    return dates;
  }, [weekStart, weekEnd]);

  const getEventLabel = useCallback((code: string) =>
    planEventTypes.find(c => c.code === code)?.codeName ?? code,
    [planEventTypes]);

  /* ── 내용 selectbox 파생 상태 ── */

  const contentOptions = useMemo(
    () => EVENT_CONTENT_OPTIONS[editRow.eventTypeCode ?? ''] ?? [],
    [editRow.eventTypeCode],
  );

  const isCustomContent = useMemo(
    () => !contentOptions.includes(editRow.eventContent ?? ''),
    [contentOptions, editRow.eventContent],
  );

  /* ── 데이터 조회 ── */

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ startDate: weekStart, endDate: weekEnd });
      const res = await authFetch(`/api/et/operation-plan?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRows(json.data?.content || []);
      }
    } catch {
      notify(t('message.networkError', '설비가동계획 조회에 실패했습니다'), { type: 'error' });
    }
  }, [weekStart, weekEnd, notify, t]);

  const fetchEquip = useCallback(async () => {
    try {
      const res = await authFetch('/api/master/equipments');
      if (res.ok) {
        const json = await res.json();
        const items = (json.data?.content || []) as { id: number; unitNumber: string; lineName: string }[];
        setEquipList(items.map(e => ({ id: e.id, label: `${e.unitNumber}-${e.lineName}` })));
      }
    } catch {
      notify(t('message.networkError', '설비 목록 조회에 실패했습니다'), { type: 'error' });
    }
  }, [notify, t]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchEquip(); }, [fetchEquip]);

  /* ── 주간 네비 ── */

  const handlePrevWeek = () => {
    setWeekStart(w => addDays(w, -7));
    setWeekEnd(e => addDays(e, -7));
  };
  const handleNextWeek = () => {
    setWeekStart(w => addDays(w, 7));
    setWeekEnd(e => addDays(e, 7));
  };
  const handleThisWeek = () => {
    const mon = getMonday(new Date());
    setWeekStart(mon);
    setWeekEnd(addDays(mon, 6));
  };

  /* ── 매트릭스 데이터 변환 ── */

  const matrixData = useMemo(() => {
    const map = new Map<number, { label: string; byDate: Map<string, OperationPlanRow[]> }>();
    for (const eq of equipList) {
      map.set(eq.id, { label: eq.label, byDate: new Map() });
    }
    for (const row of rows) {
      if (!row.equipId || !row.planDate) continue;
      const entry = map.get(row.equipId);
      if (!entry) continue;
      const dateStr = String(row.planDate).slice(0, 10);
      if (!entry.byDate.has(dateStr)) entry.byDate.set(dateStr, []);
      entry.byDate.get(dateStr)!.push(row);
    }
    return map;
  }, [rows, equipList]);

  /* ── CRUD 핸들러 ── */

  const handleNew = (equipId?: number, planDate?: string) => {
    setEditRow(emptyForm(equipId, planDate));
    setIsNew(true);
    setShowForm(true);
  };

  const handleEdit = (row: OperationPlanRow) => {
    setEditRow({ ...row });
    setIsNew(false);
    setShowForm(true);
  };

  const handleCancel = () => setShowForm(false);

  /* 소요시간 변경 → 종료시각 자동계산 + 가동가능 시간 자동 차감 */
  const handleStdTimeChange = (val: string) => {
    const stdTimeH = val ? +val : undefined;
    setEditRow(r => {
      const start = r.startTime ?? DEFAULT_START;
      const endTime = stdTimeH && stdTimeH > 0 ? calcEndTime(start, stdTimeH) : r.endTime;
      const availTimeH = stdTimeH != null && stdTimeH >= 0
        ? Math.max(0, 24 - stdTimeH)
        : 24;
      return { ...r, stdTimeH, endTime, availTimeH };
    });
  };

  /* 시작시각 변경 → 종료시각 재계산 (소요시간이 있을 때만) */
  const handleStartTimeChange = (val: string) => {
    setEditRow(r => {
      const endTime = r.stdTimeH && r.stdTimeH > 0 ? calcEndTime(val, r.stdTimeH) : r.endTime;
      return { ...r, startTime: val, endTime };
    });
  };

  /* 이벤트유형 변경 → 내용 초기화 */
  const handleEventTypeChange = (code: string) => {
    setEditRow(r => ({ ...r, eventTypeCode: code, eventContent: '' }));
  };

  /* 내용 selectbox 변경 */
  const handleContentSelectChange = (val: string) => {
    // val === '' → 직접입력 모드 (eventContent 유지하되 predefined 아닌 값으로)
    setEditRow(r => ({ ...r, eventContent: val === '' ? '' : val }));
  };

  const handleSave = useCallback(async () => {
    if (!editRow.planDate) { notify('계획일을 입력해주세요', { type: 'error' }); return; }
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/et/operation-plan' : `/api/et/operation-plan/${editRow.id}`;
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRow),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        throw new Error(err?.message || '저장에 실패했습니다');
      }
      notify(t('message.saveSuccess', '저장되었습니다'), { type: 'success' });
      setShowForm(false);
      await fetchData();
    } catch (e) {
      notify(e instanceof Error ? e.message : t('message.saveFailed', '저장에 실패했습니다'), { type: 'error' });
    }
  }, [editRow, isNew, fetchData, notify, t]);

  const handleDelete = useCallback(async (row: OperationPlanRow) => {
    if (!row.id) return;
    if (!await confirmDialog(`설비가동계획(ID: ${row.id})을 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`/api/et/operation-plan/${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('message.deleteFailed', '삭제에 실패했습니다'));
      notify(t('message.deleteSuccess', '삭제되었습니다'), { type: 'success' });
      setShowForm(false);
      await fetchData();
    } catch {
      notify(t('message.deleteFailed', '삭제에 실패했습니다'), { type: 'error' });
    }
  }, [confirmDialog, fetchData, notify, t]);

  /* ── 스타일 상수 ── */

  const thBase: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    padding: '6px 8px',
    background: '#f8fafc',
    fontWeight: 600,
    fontSize: 12,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tdLabel: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    padding: '4px 6px',
    background: '#f8fafc',
    fontSize: 11,
    color: '#64748b',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };

  const tdCell: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    padding: 4,
    verticalAlign: 'top',
    fontSize: 12,
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'right', padding: '6px 8px', whiteSpace: 'nowrap',
    color: 'var(--color-text-disabled)', fontSize: 13, verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #94a3b8',
    borderRadius: 4,
    padding: '5px 8px',
    background: '#fff',
    fontSize: 13,
    outline: 'none',
  };

  /* ── 렌더 ── */

  return (
    <>
      <PageFilterShell
        title={t('menu.ET0110', '설비가동계획')}
        toolbar={
          <>
            <DateRangeFilter
              label=""
              dateFrom={weekStart}
              dateTo={weekEnd}
              onDateFromChange={v => {
                setWeekStart(v);
                // from 변경 시 to가 from + 31일 초과하면 to를 from + 31일로 조정
                const maxTo = addDays(v, 31);
                if (weekEnd > maxTo) setWeekEnd(maxTo);
                // from이 to보다 크면 to를 from + 6일로 조정
                else if (v > weekEnd) setWeekEnd(addDays(v, 6));
              }}
              onDateToChange={v => {
                setWeekEnd(v);
                // to 변경 시 from이 to - 31일 이전이면 from을 to - 31일로 조정
                const minFrom = addDays(v, -31);
                if (weekStart < minFrom) setWeekStart(minFrom);
                // to가 from보다 작으면 from을 to - 6일로 조정
                else if (v < weekStart) setWeekStart(addDays(v, -6));
              }}
            />
            <button className="mes-btn" onClick={handlePrevWeek}>◀</button>
            <button className="mes-btn" onClick={handleThisWeek}>이번 주</button>
            <button className="mes-btn" onClick={handleNextWeek}>▶</button>
          </>
        }
        toolbarRight={perm.canCreate ? (
          <button className="mes-btn mes-btn-save" onClick={() => handleNew()}>신규</button>
        ) : undefined}
      >
        {/* 범례 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '6px 16px 4px', borderBottom: '1px solid #e2e8f0' }}>
          {[
            { code: 'PM',         shortLabel: 'PM',   label: '예방보전',       color: EVENT_COLORS.PM },
            { code: 'BM',         shortLabel: 'BM',   label: '고장보전',       color: EVENT_COLORS.BM },
            { code: 'PD',         shortLabel: 'PD',   label: '계획비가동',     color: EVENT_COLORS.PD },
            { code: 'MAT_CHANGE', shortLabel: '자재', label: '자재교체',       color: EVENT_COLORS.MAT_CHANGE },
            { code: 'TACT_DELAY', shortLabel: 'Tact', label: 'Tact time 지연', color: EVENT_COLORS.TACT_DELAY },
            { code: 'OTHER',      shortLabel: 'etc',  label: '기타',           color: EVENT_COLORS.OTHER },
          ].map(item => (
            <span key={item.code} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: item.color + '18',
              border: `1px solid ${item.color}`,
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
            }}>
              <span style={{
                background: item.color, color: '#fff',
                borderRadius: 3, padding: '1px 5px', fontSize: 11, fontWeight: 600,
              }}>{item.shortLabel}</span>
              <span style={{ color: '#334155' }}>{item.label}</span>
            </span>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 120 }} />
              <col style={{ width: 90 }} />
              {weekDates.map(d => <col key={d} style={{ width: 140 }} />)}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...thBase, position: 'sticky', left: 0, zIndex: 12 }}>설비</th>
                <th rowSpan={2} style={{ ...thBase, position: 'sticky', left: 120, zIndex: 12 }}>구분</th>
                {weekDates.map((d) => {
                  const dow = new Date(d).getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  const dowIdx = dow === 0 ? 6 : dow - 1;
                  return (
                    <th key={d} style={{
                      ...thBase,
                      background: isWeekend ? '#fef2f2' : '#dbeafe',
                      color: isWeekend ? '#dc2626' : '#1e40af',
                    }}>
                      {DOW_KO[dowIdx]}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {weekDates.map((d) => {
                  const dow = new Date(d).getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th key={d} style={{
                      ...thBase,
                      background: isWeekend ? '#fef2f2' : '#eff6ff',
                      color: isWeekend ? '#dc2626' : '#334155',
                      fontWeight: 400,
                      fontSize: 11,
                    }}>
                      {d.slice(5)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {equipList.length === 0 ? (
                <tr>
                  <td colSpan={weekDates.length + 2} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                    설비 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                equipList.map(eq => {
                  const entry = matrixData.get(eq.id);
                  return (
                    <React.Fragment key={eq.id}>
                      {/* 이벤트 행 */}
                      <tr>
                        <td rowSpan={3} style={{
                          border: '1px solid #e2e8f0',
                          fontWeight: 700,
                          fontSize: 12,
                          textAlign: 'center',
                          background: '#f8fafc',
                          verticalAlign: 'middle',
                          position: 'sticky',
                          left: 0,
                          zIndex: 5,
                        }}>
                          {eq.label}
                        </td>
                        <td style={{ ...tdLabel, position: 'sticky', left: 120, zIndex: 4 }}>이벤트</td>
                        {weekDates.map(d => {
                          const events = entry?.byDate.get(d) ?? [];
                          return (
                            <td key={d}
                              style={{ ...tdCell, cursor: perm.canCreate ? 'pointer' : 'default', minHeight: 32 }}
                              onClick={() => events.length === 0 && perm.canCreate && handleNew(eq.id, d)}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {events.map(ev => (
                                  <span
                                    key={ev.id}
                                    style={{
                                      background: EVENT_COLORS[ev.eventTypeCode ?? ''] ?? '#64748b',
                                      color: '#fff',
                                      borderRadius: 4,
                                      padding: '2px 7px',
                                      fontSize: 11,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={e => { e.stopPropagation(); handleEdit(ev); }}
                                  >
                                    {getEventLabel(ev.eventTypeCode ?? '')}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* 소요시간 행 */}
                      <tr>
                        <td style={{ ...tdLabel, position: 'sticky', left: 120, zIndex: 4 }}>소요시간(h)</td>
                        {weekDates.map(d => {
                          const events = entry?.byDate.get(d) ?? [];
                          const total = events.reduce((s, e) => s + (Number(e.stdTimeH) || 0), 0);
                          return (
                            <td key={d} style={{ ...tdCell, textAlign: 'center', color: '#334155' }}>
                              {total > 0 ? total : ''}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 시각 행 */}
                      <tr>
                        <td style={{ ...tdLabel, position: 'sticky', left: 120, zIndex: 4 }}>시작-종료</td>
                        {weekDates.map(d => {
                          const events = entry?.byDate.get(d) ?? [];
                          let text = '';
                          if (events.length === 1) {
                            const s = (events[0].startTime ?? '').slice(0, 5);
                            const e = (events[0].endTime ?? '').slice(0, 5);
                            text = s || e ? `${s}~${e}` : '';
                          } else if (events.length > 1) {
                            const s = (events[0].startTime ?? '').slice(0, 5);
                            text = s ? `${s}~ +${events.length - 1}` : `+${events.length}`;
                          }
                          return (
                            <td key={d} style={{ ...tdCell, textAlign: 'center', fontSize: 11, color: '#475569' }}>
                              {text}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PageFilterShell>

      <Modal
        open={showForm}
        onClose={handleCancel}
        title={isNew ? '설비가동계획 등록' : '설비가동계획 수정'}
        width={580}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <th style={thStyle}>설비</th>
              <td style={{ padding: '4px 8px' }}>
                <select
                  value={editRow.equipId ?? ''}
                  onChange={e => setEditRow(r => ({ ...r, equipId: e.target.value ? +e.target.value : undefined }))}
                  style={{ ...inputStyle }}
                >
                  <option value="">-- 선택 --</option>
                  {equipList.map(eq => <option key={eq.id} value={eq.id}>{eq.label}</option>)}
                </select>
              </td>
              <th style={thStyle}>이벤트유형</th>
              <td style={{ padding: '4px 8px' }}>
                <select
                  value={editRow.eventTypeCode ?? ''}
                  onChange={e => handleEventTypeChange(e.target.value)}
                  style={{ ...inputStyle }}
                >
                  <option value="">-- 선택 --</option>
                  {planEventTypes.map(c => <option key={c.code} value={c.code}>{c.codeName}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <th style={thStyle}>내용</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <select
                  value={isCustomContent ? '' : (editRow.eventContent ?? '')}
                  onChange={e => handleContentSelectChange(e.target.value)}
                  style={{ ...inputStyle }}
                  disabled={!editRow.eventTypeCode}
                >
                  <option value="">직접 입력</option>
                  {contentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isCustomContent && (
                  <input
                    value={editRow.eventContent ?? ''}
                    onChange={e => setEditRow(r => ({ ...r, eventContent: e.target.value }))}
                    placeholder="내용을 직접 입력하세요"
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                )}
              </td>
            </tr>
            <tr>
              <th style={thStyle}>계획일</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="date"
                  value={editRow.planDate ?? ''}
                  onChange={e => setEditRow(r => ({ ...r, planDate: e.target.value }))}
                  style={{ ...inputStyle }}
                />
              </td>
              <th style={thStyle}>소요시간(h)</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editRow.stdTimeH ?? ''}
                  onChange={e => handleStdTimeChange(e.target.value)}
                  style={{ ...inputStyle }}
                />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>시작시각</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="time"
                  value={(editRow.startTime ?? '').slice(0, 5)}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                />
              </td>
              <th style={thStyle}>종료시각</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="time"
                  value={(editRow.endTime ?? '').slice(0, 5)}
                  onChange={e => setEditRow(r => ({ ...r, endTime: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                />
              </td>
            </tr>
            <tr>
              <th style={thStyle}>가동가능(h)</th>
              <td style={{ padding: '4px 8px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editRow.availTimeH ?? ''}
                  onChange={e => setEditRow(r => ({ ...r, availTimeH: e.target.value ? +e.target.value : undefined }))}
                  style={{ ...inputStyle }}
                />
              </td>
              <td colSpan={2} />
            </tr>
            <tr>
              <th style={thStyle}>비고</th>
              <td colSpan={3} style={{ padding: '4px 8px' }}>
                <textarea
                  value={editRow.remark ?? ''}
                  onChange={e => setEditRow(r => ({ ...r, remark: e.target.value }))}
                  style={{ ...inputStyle, height: 60, resize: 'vertical' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {!isNew && perm.canDelete && (
            <button className="mes-btn mes-btn-delete" onClick={() => handleDelete(editRow)}>삭제</button>
          )}
          <button className="mes-btn" onClick={handleCancel}>취소</button>
          {(isNew ? perm.canCreate : perm.canUpdate) && (
            <button className="mes-btn mes-btn-save" onClick={handleSave}>저장</button>
          )}
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  );
}
