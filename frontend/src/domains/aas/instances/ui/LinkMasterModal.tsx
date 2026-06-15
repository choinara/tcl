import React, { useCallback, useEffect, useState } from 'react';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Modal } from '@/components/ui/Modal';
import { authFetch } from '@/lib/api';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/ToastProvider';
import type {
  ColKeyEntry, ColumnDef, LinkedColumnEntry,
  LinkResult, MenuOption,
} from '../types';

ModuleRegistry.registerModules([AllCommunityModule]);

const API = '';

interface Props {
  open: boolean;
  instanceId: number | null;      // null = 신규 행
  tempRowId?: string;             // 신규 행 임시 식별자
  currentMenuCode?: string;       // 기존 연결 메뉴 코드 (재연결 시 pre-select)
  onClose: () => void;
  onConfirm: (result: LinkResult) => void;
}

type Step = 1 | 2 | 3;

export function LinkMasterModal({
  open, onClose, onConfirm,
}: Props) {
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const { notify } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenu, setSelectedMenu] = useState<MenuOption | null>(null);
  const [schema, setSchema] = useState<ColumnDef[]>([]);
  const [colConfig, setColConfig] = useState<ColKeyEntry[] | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [recordKeyword, setRecordKeyword] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadMenus = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/api/aas/master-records/menus`);
      if (!res.ok) { notify('메뉴 목록 로드 실패', { type: 'error' }); return; }
      const json = await res.json();
      setMenus(json.data ?? []);
    } catch {
      notify('메뉴 목록 로드 중 오류 발생', { type: 'error' });
    }
  }, [notify]);

  // 팝업 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setStep(1);
      setMenuSearch('');
      setSelectedMenu(null);
      setSchema([]);
      setColConfig(null);
      setRecords([]);
      setRecordKeyword('');
      setSelectedRecord(null);
      setCheckedKeys(new Set());
      loadMenus();
    }
  }, [open, loadMenus]);

  const fetchRecords = useCallback(async (menuCode: string, kw: string) => {
    try {
      const res = await authFetch(
        `${API}/api/aas/master-records/${menuCode}/records?keyword=${encodeURIComponent(kw)}&size=100`,
      );
      if (!res.ok) { notify('레코드 로드 실패', { type: 'error' }); return; }
      const json = await res.json();
      setRecords(json.data?.records ?? []);
    } catch {
      notify('레코드 로드 중 오류 발생', { type: 'error' });
    }
  }, [notify]);

  // Step 1: 메뉴 선택 → col-config 확인 → 분기
  const handleMenuSelect = async (menu: MenuOption) => {
    setSelectedMenu(menu);
    setLoading(true);
    try {
      // schema 조회
      const schemaRes = await authFetch(`${API}/api/aas/master-records/${menu.menuCode}/schema`);
      if (schemaRes.ok) {
        const sd = await schemaRes.json();
        setSchema(sd.data ?? []);
      }
      // col-config 조회 — 없으면 404
      const cfgRes = await authFetch(`${API}/api/aas/master-records/${menu.menuCode}/col-config`);
      if (cfgRes.status === 404 || !cfgRes.ok) {
        setColConfig(null);
        setStep(2);   // 컬럼 선택 단계
      } else {
        const cfg = await cfgRes.json();
        const keys: ColKeyEntry[] = cfg.data?.colKeys ?? [];
        setColConfig(keys.length > 0 ? keys : null);
        if (keys.length > 0) {
          await fetchRecords(menu.menuCode, '');
          setStep(3); // 레코드 선택 단계 (컬럼 설정 건너뜀)
        } else {
          setStep(2);
        }
      }
    } catch {
      notify('메뉴 정보 로드 중 오류 발생', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 컬럼 설정 저장 → Step 3
  const handleColConfigSave = async () => {
    if (!selectedMenu) return;
    const selectedKeys = schema.filter(c => checkedKeys.has(c.key));
    if (selectedKeys.length === 0) { notify('최소 1개 컬럼을 선택해 주세요.', { type: 'error' }); return; }

    const colKeys: ColKeyEntry[] = selectedKeys.map((c, i) => ({ seq: i + 1, key: c.key, label: c.label }));
    setLoading(true);
    try {
      const res = await authFetch(`${API}/api/aas/master-records/${selectedMenu.menuCode}/col-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colKeys }),
      });
      if (!res.ok) { notify('컬럼 설정 저장 실패', { type: 'error' }); return; }
      setColConfig(colKeys);
      await fetchRecords(selectedMenu.menuCode, '');
      setStep(3);
    } catch {
      notify('컬럼 설정 저장 중 오류 발생', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: 컬럼 재설정 (useConfirm 경고)
  const handleResetColumns = async () => {
    const ok = await confirmDialog(
      '컬럼 설정을 재설정하면 동일 메뉴에 연결된 모든 인스턴스의 표시 컬럼이 변경됩니다. 계속할까요?',
    );
    if (!ok) return;
    setColConfig(null);
    setCheckedKeys(new Set());
    setStep(2);
  };

  // Step 3: 레코드 검색
  const handleRecordSearch = async (kw: string) => {
    setRecordKeyword(kw);
    if (selectedMenu) await fetchRecords(selectedMenu.menuCode, kw);
  };

  // Step 3: 연결 완료
  const handleConfirm = () => {
    if (!selectedMenu || !selectedRecord || !colConfig) return;
    const columns: LinkedColumnEntry[] = colConfig.map(cfg => ({
      seq: cfg.seq,
      key: cfg.key,
      label: cfg.label,
      value: String(selectedRecord[cfg.key] ?? ''),
    }));
    onConfirm({
      menuCode: selectedMenu.menuCode,
      recordId: Number(selectedRecord['id']),
      columns,
    });
    onClose();
  };

  const filteredMenus = menus.filter(m =>
    m.menuName.includes(menuSearch) || m.menuCode.includes(menuSearch),
  );

  // Step 3 레코드 그리드 컬럼: colConfig 기준
  const recordGridCols: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    ...(colConfig ?? schema).map(c => ({
      field: c.key, headerName: c.label, flex: 1,
    })),
  ];

  const title = step === 1 ? '기준정보 선택'
    : step === 2 ? `컬럼 선택 — ${selectedMenu?.menuName}`
    : `레코드 선택 — ${selectedMenu?.menuName}`;

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {loading && <div className="text-center py-4 text-gray-400">로딩 중...</div>}

      {/* Step 1: 메뉴 선택 */}
      {!loading && step === 1 && (
        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-1.5 text-sm"
            placeholder="메뉴 검색..."
            value={menuSearch}
            onChange={e => setMenuSearch(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto border rounded divide-y">
            {filteredMenus.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">검색 결과 없음</div>
            )}
            {filteredMenus.map(m => (
              <button
                key={m.menuCode}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm"
                onClick={() => handleMenuSelect(m)}
              >
                <span className="font-medium">{m.menuName}</span>
                <span className="ml-2 text-gray-400 text-xs">{m.menuCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: 컬럼 선택 */}
      {!loading && step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">연결할 컬럼을 최대 5개 선택하세요.</p>
          <div className="border rounded divide-y max-h-60 overflow-y-auto">
            {schema.map(col => {
              const checked = checkedKeys.has(col.key);
              const disabled = !checked && checkedKeys.size >= 5;
              return (
                <label key={col.key} className={`flex items-center gap-2 px-4 py-2 text-sm ${disabled ? 'opacity-40' : 'cursor-pointer hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={e => {
                      setCheckedKeys(prev => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(col.key); else next.delete(col.key);
                        return next;
                      });
                    }}
                  />
                  {col.label}
                  <span className="text-gray-400 text-xs">({col.key})</span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button className="mes-btn" onClick={() => setStep(1)}>뒤로</button>
            <button
              className="mes-btn mes-btn-save"
              disabled={checkedKeys.size === 0}
              onClick={handleColConfigSave}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 레코드 선택 */}
      {!loading && step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <input
              className="border rounded px-3 py-1.5 text-sm w-64"
              placeholder="검색..."
              value={recordKeyword}
              onChange={e => handleRecordSearch(e.target.value)}
            />
            <button className="text-xs text-blue-500 underline" onClick={handleResetColumns}>
              컬럼 재설정
            </button>
          </div>
          <div className="ag-theme-alpine" style={{ height: 280 }}>
            <AgGridReact
              rowData={records}
              columnDefs={recordGridCols}
              rowSelection={{ mode: 'singleRow', checkboxes: false }}
              defaultColDef={{ resizable: true, sortable: true }}
              onRowClicked={e => setSelectedRecord(e.data)}
              getRowStyle={p =>
                p.data === selectedRecord
                  ? { background: '#dbeafe' }
                  : undefined
              }
            />
          </div>
          <div className="flex justify-between">
            <button className="mes-btn" onClick={() => setStep(1)}>뒤로</button>
            <button
              className="mes-btn mes-btn-save"
              disabled={!selectedRecord}
              onClick={handleConfirm}
            >
              연결
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </Modal>
  );
}
