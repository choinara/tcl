import { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import type { ColDef } from 'ag-grid-community';
import { PageTitle } from '@/components/ui/PageTitle';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import type { AssetTypeDB, FieldSchemaItem } from '../../shared/types';

// UI 템플릿용 고정 Mock 데이터 (백엔드 연결 없음)
const MOCK_TYPES: AssetTypeDB[] = [
  {
    type_code: 'laminator', type_name: 'Laminator',
    shell_id: 'https://example.com/aas/shells/LD',
    description: 'LD 라미네이터 설비 타입',
    field_schema: [
      { key: 'manufacturer', label: '제조사', type: 'text' },
      { key: 'rated_power', label: '정격전력(kW)', type: 'number' },
    ],
  },
  {
    type_code: 'vision_pc', type_name: 'Vision PC',
    shell_id: null, description: '비전 검사 PC 타입',
    field_schema: [{ key: 'os_version', label: 'OS 버전', type: 'text' }],
  },
  {
    type_code: 'plc', type_name: 'PLC 컨트롤러',
    shell_id: null, description: 'LS산전 XGT PLC',
    field_schema: [],
  },
];

const MOCK_INSTANCES = [
  { id: 1, instance_id: 'LD-16A', instance_name: 'LD-16A 라미네이터', type_code: 'laminator', location_floor: '6F', serial_number: 'SN-2024-001', status: 'ACTIVE',      opcua_node_count: 89, extra_fields: { manufacturer: 'LS산전', rated_power: 15 } },
  { id: 2, instance_id: 'LD-16B', instance_name: 'LD-16B 라미네이터', type_code: 'laminator', location_floor: '6F', serial_number: 'SN-2024-002', status: 'ACTIVE',      opcua_node_count: 89, extra_fields: { manufacturer: 'LS산전', rated_power: 15 } },
  { id: 3, instance_id: 'LD-17A', instance_name: 'LD-17A 라미네이터', type_code: 'laminator', location_floor: '6F', serial_number: 'SN-2024-003', status: 'MAINTENANCE', opcua_node_count: 89, extra_fields: { manufacturer: 'LS산전', rated_power: 15 } },
  { id: 4, instance_id: 'VPC-6F-01', instance_name: '6층 비전PC #1',  type_code: 'vision_pc', location_floor: '6F', serial_number: 'VP-2023-001', status: 'ACTIVE',      opcua_node_count: 0,  extra_fields: { os_version: 'Windows 11' } },
  { id: 5, instance_id: 'PLC-6F-01', instance_name: '6층 PLC #1',    type_code: 'plc',       location_floor: '6F', serial_number: 'PL-2022-001', status: 'ACTIVE',      opcua_node_count: 0,  extra_fields: {} },
  { id: 6, instance_id: 'LD-18A', instance_name: 'LD-18A 라미네이터', type_code: 'laminator', location_floor: '4F', serial_number: 'SN-2024-004', status: 'INACTIVE',    opcua_node_count: 89, extra_fields: { manufacturer: 'LS산전', rated_power: 15 } },
];

// ─── Inline styles ───
const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
  borderRadius: 8, padding: 16,
};
const badgeStyle = (color: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; text: string }> = {
    red: { bg: '#fecaca', text: '#dc2626' }, green: { bg: '#bbf7d0', text: '#16a34a' },
    blue: { bg: '#bfdbfe', text: '#2563eb' }, yellow: { bg: '#fef08a', text: '#ca8a04' }, gray: { bg: '#e5e7eb', text: '#6b7280' },
  };
  const c = colors[color] || colors.gray;
  return { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text };
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)',
  borderRadius: 4, fontSize: 13, boxSizing: 'border-box',
};

// ─── Asset Type Modal (로컬 상태만 변경 — UI 템플릿) ───
function AssetTypeModal({ open, onClose, onSave, assetType }: {
  open: boolean; onClose: () => void; onSave: (updated: AssetTypeDB) => void; assetType: AssetTypeDB | null;
}) {
  const { notify } = useToast();
  const [form, setForm] = useState({
    type_code: assetType?.type_code ?? '',
    type_name: assetType?.type_name ?? '',
    shell_id: assetType?.shell_id ?? '',
    description: assetType?.description ?? '',
  });
  const [fieldSchema, setFieldSchema] = useState<FieldSchemaItem[]>(
    assetType?.field_schema.map(f => ({ key: f.key, label: f.label, type: f.type as 'text' | 'number' | 'textarea' })) ?? []
  );
  const [error, setError] = useState<string | null>(null);

  const addField = () => setFieldSchema([...fieldSchema, { key: '', label: '', type: 'text' }]);
  const removeField = (i: number) => setFieldSchema(fieldSchema.filter((_, idx) => idx !== i));
  const updateField = (i: number, field: Partial<FieldSchemaItem>) => setFieldSchema(fieldSchema.map((f, idx) => idx === i ? { ...f, ...field } : f));

  const handleSave = () => {
    if (!form.type_name) { setError('타입 이름은 필수입니다.'); return; }
    for (const f of fieldSchema) { if (!f.key || !f.label) { setError('모든 추가 속성의 키와 레이블을 입력해주세요.'); return; } }
    onSave({ ...form, shell_id: form.shell_id || null, description: form.description || null, field_schema: fieldSchema });
    notify('저장되었습니다.', { type: 'success' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Asset Type 수정" width={550}>
      {error && <div style={{ marginBottom: 12, padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="타입 코드" required value={form.type_code} onChange={(e) => setForm({ ...form, type_code: e.target.value })} disabled={true} placeholder="예: plc_controller" />
        <FormField label="타입 이름" required value={form.type_name} onChange={(e) => setForm({ ...form, type_name: e.target.value })} placeholder="예: PLC 컨트롤러" />
      </div>
      <FormField label="Shell ID (AAS 연결)" value={form.shell_id} onChange={(e) => setForm({ ...form, shell_id: e.target.value })} placeholder="예: https://example.com/aas/shell/..." />
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>설명</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="타입 설명"
          style={{ ...inputStyle, height: 60, resize: 'none' }} />
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Instance 테이블 컬럼</span>
          <button className="mes-btn mes-btn-new" onClick={addField} style={{ padding: '4px 10px', fontSize: 12 }}>
            <Plus className="w-3.5 h-3.5" /> 컬럼 추가
          </button>
        </div>
        {fieldSchema.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-disabled)', fontSize: 13, padding: 16 }}>정의된 컬럼이 없습니다.</div>
        ) : fieldSchema.map((field, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 10, background: 'var(--color-bg-hover, #f8fafc)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div><label style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>키 (영문)</label>
                <input style={{ ...inputStyle, fontSize: 12 }} value={field.key} onChange={(e) => updateField(idx, { key: e.target.value })} placeholder="manufacturer" /></div>
              <div><label style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>레이블</label>
                <input style={{ ...inputStyle, fontSize: 12 }} value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="제조사" /></div>
              <div><label style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>타입</label>
                <select style={{ ...inputStyle, fontSize: 12 }} value={field.type} onChange={(e) => updateField(idx, { type: e.target.value as 'text' | 'number' | 'textarea' })}>
                  <option value="text">텍스트</option><option value="number">숫자</option><option value="textarea">여러 줄</option>
                </select></div>
            </div>
            <button className="mes-btn mes-btn-delete" onClick={() => removeField(idx)} style={{ padding: '4px 6px', marginTop: 16 }}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <button className="mes-btn" onClick={onClose}>취소</button>
        <button className="mes-btn mes-btn-save" onClick={handleSave}>저장</button>
      </div>
    </Modal>
  );
}

// ─── Main Page ───
export default function AasInstancesOldPage() {
  const perm = usePermission('AA0021');
  const { notify } = useToast();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const editGridRef = useRef<PeakEditGridRef>(null);
  const [types, setTypes] = useState<AssetTypeDB[]>(MOCK_TYPES);
  const [instances, setInstances] = useState(MOCK_INSTANCES);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [typePopupOpen, setTypePopupOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssetTypeDB | null>(null);

  const getTypeName = useCallback((code: string) => types.find(t => t.type_code === code)?.type_name || code, [types]);
  const typeNameToCode = useMemo(() => new Map(types.map(t => [t.type_name, t.type_code])), [types]);
  const filteredInstances = useMemo(() => selectedType ? instances.filter(i => i.type_code === selectedType) : instances, [selectedType, instances]);
  const handleTypeCardClick = (typeCode: string) => setSelectedType(selectedType === typeCode ? null : typeCode);

  const handleEditType = () => {
    const t = types.find(t => t.type_code === selectedType);
    if (t) { setEditingType(t); setTypePopupOpen(true); }
  };

  const handleDeleteType = async () => {
    if (!selectedType) return;
    const typeName = types.find(t => t.type_code === selectedType)?.type_name;
    if (!await confirmDialog(`"${typeName}" 타입을 삭제하시겠습니까?`)) return;
    setTypes(prev => prev.filter(t => t.type_code !== selectedType));
    setInstances(prev => prev.filter(i => i.type_code !== selectedType));
    setSelectedType(null);
    notify('삭제되었습니다.', { type: 'success' });
  };

  const handleTypeSave = (updated: AssetTypeDB) => {
    setTypes(prev => prev.map(t => t.type_code === updated.type_code ? updated : t));
  };

  // PeakEditGrid용 데이터 변환
  const gridData = useMemo<Record<string, unknown>[]>(() => {
    return filteredInstances.map(inst => {
      const row: Record<string, unknown> = {
        id: inst.id, instance_id: inst.instance_id, instance_name: inst.instance_name,
        type_code: inst.type_code, location_floor: inst.location_floor,
        serial_number: inst.serial_number, status: inst.status, opcua_node_count: inst.opcua_node_count,
      };
      if (inst.extra_fields) {
        for (const [k, v] of Object.entries(inst.extra_fields)) row[`extra__${k}`] = v ?? '';
      }
      return row;
    });
  }, [filteredInstances]);

  const gridColumns = useMemo<ColDef[]>(() => {
    const typeOptions = types.map(t => t.type_code).join(',');
    const base: ColDef[] = [
      { headerName: 'Instance ID', field: 'instance_id', width: 160, editable: true },
      { headerName: '이름', field: 'instance_name', flex: 1, minWidth: 120, editable: true },
      { headerName: '타입', field: 'type_code', width: 130, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: typeOptions.split(',') }, valueFormatter: p => getTypeName(p.value as string) },
      { headerName: '위치', field: 'location_floor', width: 80, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['4F', '6F'] } },
      { headerName: '시리얼번호', field: 'serial_number', width: 140, editable: true },
      { headerName: 'OPC-UA', field: 'opcua_node_count', width: 90, editable: false, cellStyle: { textAlign: 'center' } },
      { headerName: '상태', field: 'status', width: 110, editable: true, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] } },
    ];
    if (selectedType) {
      const schema = types.find(t => t.type_code === selectedType)?.field_schema;
      schema?.forEach(field => base.push({ headerName: field.label, field: `extra__${field.key}`, width: 130, editable: true }));
    }
    return base;
  }, [selectedType, types, getTypeName]);

  // 로컬 상태만 변경 (UI 템플릿 — 백엔드 연결 없음)
  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    for (const row of rows) {
      const state = row._rowState;
      const extraFields: Record<string, unknown> = {};
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === '_rowState' || k === '__rowId' || k === '__isTotal') continue;
        if (k.startsWith('extra__')) { extraFields[k.replace('extra__', '')] = v; } else { payload[k] = v; }
      }
      if (Object.keys(extraFields).length > 0) payload.extra_fields = extraFields;
      if (payload.type_code && typeNameToCode.has(payload.type_code as string)) {
        payload.type_code = typeNameToCode.get(payload.type_code as string);
      }
      if (state === 'created') {
        setInstances(prev => [...prev, { id: Date.now(), instance_id: String(payload.instance_id || ''), instance_name: String(payload.instance_name || ''), type_code: String(payload.type_code || ''), location_floor: String(payload.location_floor || ''), serial_number: String(payload.serial_number || ''), status: String(payload.status || 'ACTIVE'), opcua_node_count: 0, extra_fields: extraFields as Record<string, string | number> }]);
      } else if (state === 'updated') {
        setInstances(prev => prev.map(i => i.instance_id === payload.instance_id ? { ...i, ...payload, extra_fields: { ...i.extra_fields, ...extraFields } as Record<string, string | number> } : i));
      } else if (state === 'deleted') {
        setInstances(prev => prev.filter(i => i.instance_id !== payload.instance_id));
      }
    }
    notify('저장되었습니다.', { type: 'success' });
  }, [notify, typeNameToCode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageTitle menuCode="AA0021" />
      <div style={{ padding: '12px 16px', flex: 1, display: 'flex', gap: 16, overflow: 'hidden' }}>

        {/* 좌측: Asset Type */}
        <div style={{ ...cardStyle, width: 280, minWidth: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Asset Type</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="mes-btn mes-btn-edit" onClick={handleEditType} disabled={!selectedType} style={{ padding: '4px 8px', fontSize: 12 }}>수정</button>
              <button className="mes-btn mes-btn-delete" onClick={handleDeleteType} disabled={!selectedType} style={{ padding: '4px 8px', fontSize: 12 }}>삭제</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginBottom: 10 }}>클릭하여 Instance 필터링</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map(t => {
                const ic = instances.filter(i => i.type_code === t.type_code).length;
                return (
                  <div key={t.type_code} onClick={() => handleTypeCardClick(t.type_code)}
                    onDoubleClick={() => { setSelectedType(t.type_code); setEditingType(t); setTypePopupOpen(true); }}
                    style={{
                      padding: 12, borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s',
                      border: selectedType === t.type_code ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: selectedType === t.type_code ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.type_name}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {ic > 0 && <span style={badgeStyle('green')}>{ic}대</span>}
                        {t.field_schema?.length > 0 && <span style={badgeStyle('blue')}>{t.field_schema.length}Property</span>}
                      </div>
                    </div>
                    {t.description && <div style={{ fontSize: 11, color: 'var(--color-text-disabled)', marginTop: 6, lineHeight: 1.4 }}>{t.description}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측: Asset Instance (PeakEditGrid) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Asset Instance</span>
            {selectedType ? (
              <><span style={badgeStyle('blue')}>{getTypeName(selectedType)}</span><span style={{ fontSize: 13, color: 'var(--color-text-disabled)' }}>{filteredInstances.length}개</span></>
            ) : <span style={{ fontSize: 13, color: 'var(--color-text-disabled)' }}>전체 {instances.length}개</span>}
          </div>
          <PeakEditGrid
            ref={editGridRef}
            gridId={`asset-instance-template${selectedType ? `-${selectedType}` : ''}`}
            columns={gridColumns}
            data={gridData}
            bodyHeight="fitToParent"
            onBatchSave={handleBatchSave}
            permission={perm}
          />
        </div>
      </div>

      <AssetTypeModal key={editingType?.type_code ?? 'new'} open={typePopupOpen} onClose={() => setTypePopupOpen(false)} onSave={handleTypeSave} assetType={editingType} />
      <ConfirmDialog />
    </div>
  );
}
