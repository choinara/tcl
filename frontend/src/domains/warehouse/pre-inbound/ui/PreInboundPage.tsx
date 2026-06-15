import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useDateRange } from '@/hooks/useDateRange';
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { PeakEditGrid } from '@/components/grid';
import type { PeakEditGridRef } from '@/components/grid';
import type { ColDef } from 'ag-grid-community';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { Html5Qrcode } from 'html5-qrcode';

export default function PreInboundPage() {
  const perm = usePermission('WH0010');
  const { notify } = useToast();
  const editGridRef = useRef<PeakEditGridRef>(null);

  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // 마스터 검색 팝업 상태
  const [searchPopup, setSearchPopup] = useState<{
    open: boolean;
    field: 'materialCode' | 'supplierCode';
    rowIndex: number;
    keyword: string;
    results: Record<string, unknown>[];
  }>({ open: false, field: 'materialCode', rowIndex: -1, keyword: '', results: [] });

  const fetchData = useCallback(async (from?: string, to?: string) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('startDate', from);
      if (to) params.set('endDate', to);
      const res = await authFetch(`/api/warehouse/pre-inbound?${params}`);
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.content || [];
        setData(items);
      }
    } catch {
      notify('가입고 데이터 조회에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => {
    fetchData(dateFrom, dateTo);
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo<ColDef[]>(() => [
    { field: 'lotNo', headerName: 'LOT NO', width: 140, editable: (p) => !p.data?.id },
    { field: 'materialCode', headerName: '자재코드', width: 120, editable: true },
    { field: 'materialName', headerName: '자재명', width: 180, editable: false },
    { field: 'materialType', headerName: '재질', width: 80, editable: false },
    { field: 'productSpec', headerName: '제품규격', width: 160, editable: false },
    { field: 'rawMaterial', headerName: '원재료', width: 140, editable: false },
    { field: 'hardnessType', headerName: '연_경질', width: 80, editable: false },
    { field: 'preInboundQty', headerName: '가입고량', width: 110, editable: true, cellDataType: 'number' },
    { field: 'weight', headerName: '중량(kg)', width: 100, editable: true, cellDataType: 'number' },
    { field: 'supplierCode', headerName: '업체코드', width: 120, editable: true },
    { field: 'supplierName', headerName: '업체명', width: 160, editable: false },
    { field: 'inboundSource', headerName: '입고처', width: 120, editable: true },
    { field: 'preInboundDate', headerName: '가입고일', width: 120, editable: true },
    { field: 'inboundTime', headerName: '입고시간', width: 80, editable: true },
    { field: 'createdBy', headerName: '입고작업자', width: 100, editable: true },
    { field: 'palletNo', headerName: '팔레트No', width: 100, editable: true },
    { field: 'barcodeNo', headerName: '바코드NO', width: 140, editable: true },
    { field: 'poNumber', headerName: '발주번호', width: 120, editable: true },
    { field: 'statusCd', headerName: '상태', width: 100, editable: false },
    { field: 'approvalCd', headerName: '승인', width: 100, editable: false },
    { field: 'approvedBy', headerName: '승인자', width: 100, editable: false },
    { field: 'approvedAt', headerName: '승인일시', width: 160, editable: false },
    { field: 'locationCd', headerName: '보관위치', width: 100, editable: true },
    { field: 'remark', headerName: '비고', width: 200, editable: true },
  ], []);

  const handleBatchSave = useCallback(async (rows: { _rowState: string; [key: string]: unknown }[]) => {
    const res = await authFetch('/api/warehouse/pre-inbound/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      throw new Error(err?.message || '저장에 실패했습니다.');
    }
    await fetchData(dateFrom, dateTo);
    notify('저장되었습니다', { type: 'success' });
  }, [fetchData, dateFrom, dateTo, notify]);

  // 승인
  const handleApprove = useCallback(async () => {
    const selected = editGridRef.current?.getSelectedRows() || [];
    const ids = selected.filter((r: Record<string, unknown>) => r.id).map((r: Record<string, unknown>) => r.id as number);
    if (ids.length === 0) {
      notify('승인할 행을 선택해주세요', { type: 'warning' });
      return;
    }
    try {
      const res = await authFetch('/api/warehouse/pre-inbound/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        notify(err?.message || '승인에 실패했습니다.', { type: 'error' });
        return;
      }
      await fetchData(dateFrom, dateTo);
      notify('승인 처리되었습니다', { type: 'success' });
    } catch {
      notify('승인 중 오류가 발생했습니다', { type: 'error' });
    }
  }, [fetchData, dateFrom, dateTo, notify]);

  const handleCancelApprove = useCallback(async () => {
    const selected = editGridRef.current?.getSelectedRows() || [];
    const ids = selected.filter((r: Record<string, unknown>) => r.id).map((r: Record<string, unknown>) => r.id as number);
    if (ids.length === 0) {
      notify('승인취소할 행을 선택해주세요', { type: 'warning' });
      return;
    }
    try {
      const res = await authFetch('/api/warehouse/pre-inbound/cancel-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
        notify(err?.message || '승인취소에 실패했습니다.', { type: 'error' });
        return;
      }
      await fetchData(dateFrom, dateTo);
      notify('승인취소 처리되었습니다', { type: 'success' });
    } catch {
      notify('승인취소 중 오류가 발생했습니다', { type: 'error' });
    }
  }, [fetchData, dateFrom, dateTo, notify]);

  // 바코드 자동채번 (날짜)
  const handleBarcodeByDate = useCallback(async () => {
    const selected = editGridRef.current?.getSelectedRows() || [];
    if (selected.length === 0) {
      notify('바코드를 채번할 행을 선택해주세요', { type: 'warning' });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < selected.length; i++) {
      try {
        const res = await authFetch(`/api/warehouse/pre-inbound/barcode/generate?type=date&date=${today}`);
        if (res.ok) {
          const json = await res.json();
          const barcode = json.data?.barcode;
          const rowIdx = data.findIndex((r) => r === selected[i] || r.id === selected[i].id);
          if (rowIdx >= 0) {
            editGridRef.current?.updateRowAt(rowIdx, { barcodeNo: barcode });
          }
        }
      } catch {
        notify('바코드 채번에 실패했습니다', { type: 'error' });
      }
    }
    notify('바코드가 채번되었습니다. 저장해주세요.', { type: 'info' });
  }, [data, notify]);

  // 바코드 채번 (발주번호)
  const handleBarcodeByPo = useCallback(async () => {
    const selected = editGridRef.current?.getSelectedRows() || [];
    if (selected.length === 0) {
      notify('바코드를 채번할 행을 선택해주세요', { type: 'warning' });
      return;
    }
    for (let i = 0; i < selected.length; i++) {
      const poNumber = selected[i].poNumber as string;
      if (!poNumber) {
        notify('발주번호가 없는 행이 있습니다', { type: 'warning' });
        continue;
      }
      try {
        const res = await authFetch(`/api/warehouse/pre-inbound/barcode/generate?type=po&poNumber=${encodeURIComponent(poNumber)}`);
        if (res.ok) {
          const json = await res.json();
          const barcode = json.data?.barcode;
          const rowIdx = data.findIndex((r) => r === selected[i] || r.id === selected[i].id);
          if (rowIdx >= 0) {
            editGridRef.current?.updateRowAt(rowIdx, { barcodeNo: barcode });
          }
        }
      } catch {
        notify('바코드 채번에 실패했습니다', { type: 'error' });
      }
    }
    notify('바코드가 채번되었습니다. 저장해주세요.', { type: 'info' });
  }, [data, notify]);

  // 바코드 스캔 (카메라)
  const handleStartScan = useCallback(async () => {
    setScannerOpen(true);
  }, []);

  const handleStopScan = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('스캐너 정지 실패:', e);
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    if (!scannerOpen) return;

    const timerId = setTimeout(async () => {
      const scanner = new Html5Qrcode('barcode-scanner-region');
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText) => {
            try {
              const res = await authFetch(`/api/warehouse/pre-inbound?barcodeNo=${encodeURIComponent(decodedText)}`);
              if (res.ok) {
                const json = await res.json();
                const items = json.data?.content || [];
                if (items.length > 0) {
                  setData((prev) => {
                    const exists = prev.some((r) => r.barcodeNo === decodedText);
                    return exists ? prev : [...items, ...prev];
                  });
                  notify(`바코드 ${decodedText} 조회 완료`, { type: 'success' });
                } else {
                  notify(`바코드 ${decodedText}: 등록된 데이터 없음`, { type: 'warning' });
                }
              }
            } catch {
              notify('바코드 스캔 조회에 실패했습니다', { type: 'error' });
            }
          },
          () => {} // 개별 스캔 오류 — 다음 스캔으로 자동 재시도
        );
      } catch (err) {
        notify('카메라를 사용할 수 없습니다', { type: 'error' });
        setScannerOpen(false);
      }
    }, 100);

    return () => {
      clearTimeout(timerId);
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e) => console.warn('스캐너 정지 실패:', e));
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [scannerOpen, notify]);

  // 마스터 검색
  const handleGridFieldSearch = useCallback((_field: string, rowIndex: number, rowData: Record<string, unknown>) => {
    const field = _field as 'materialCode' | 'supplierCode';
    const currentVal = (rowData[field] as string) || '';
    setSearchPopup({ open: true, field, rowIndex, keyword: currentVal, results: [] });
  }, []);

  const doMasterSearch = useCallback(async (field: 'materialCode' | 'supplierCode', keyword: string) => {
    const url = field === 'materialCode'
      ? `/api/master/raw-materials?keyword=${encodeURIComponent(keyword)}`
      : `/api/master/partners?keyword=${encodeURIComponent(keyword)}`;
    try {
      const res = await authFetch(url);
      if (res.ok) {
        const json = await res.json();
        setSearchPopup((prev) => ({ ...prev, results: json.data?.content || [] }));
      }
    } catch {
      notify('검색에 실패했습니다', { type: 'error' });
    }
  }, [notify]);

  useEffect(() => {
    if (searchPopup.open) {
      doMasterSearch(searchPopup.field, searchPopup.keyword);
    }
  }, [searchPopup.open, searchPopup.field]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMaster = useCallback((item: Record<string, unknown>) => {
    const { field, rowIndex } = searchPopup;
    if (field === 'materialCode') {
      editGridRef.current?.updateRowAt(rowIndex, {
        materialCode: item.materialCode || item.modelName,
        materialName: item.modelName || item.materialType,
        materialType: item.materialType || '',
        productSpec: item.productSpec || '',
        rawMaterial: item.rawMaterial || '',
        hardnessType: item.hardnessType || '',
      });
    } else {
      // 가입고 엔티티 필드명은 supplierCode/supplierName 유지, 실제 참조 대상은 partner
      editGridRef.current?.updateRowAt(rowIndex, {
        supplierCode: item.partnerCode,
        supplierName: item.partnerName,
      });
    }
    setSearchPopup((prev) => ({ ...prev, open: false }));
  }, [searchPopup]);

  // 상태변경 (불량/보류/반품/폐기) - 추후 구현
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    e.target.value = ''; // 셀렉트 초기화
    notify(`${val}: 추후 구현 예정`, { type: 'info' });
  }, []);

  return (
    <>
      <PageFilterShell
        title="가입고관리"
        toolbar={
          <DateRangeFilter
            label="가입고일"
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        }
      >
        <PeakEditGrid
          ref={editGridRef}
          gridId="warehouse-pre-inbound"
          columns={columns}
          data={data}
          bodyHeight="fitToParent"
          onBatchSave={handleBatchSave}
          saveButtonLabel="저장"
          showCheckbox={true}
          searchableGridFields={['materialCode', 'supplierCode']}
          onGridFieldSearch={handleGridFieldSearch}
          permission={perm}
          extraToolbarButtons={
            <>
              {perm.canApprove && <button onClick={handleApprove} className="mes-btn">승인</button>}
              {perm.canApprove && <button onClick={handleCancelApprove} className="mes-btn">승인취소</button>}
              {perm.canCreate && <button onClick={handleBarcodeByDate} className="mes-btn">바코드채번(일련)</button>}
              {perm.canCreate && <button onClick={handleBarcodeByPo} className="mes-btn">바코드채번(발주)</button>}
              {perm.canRead && <button onClick={handleStartScan} className="mes-btn">바코드스캔</button>}
              {perm.canUpdate && (
                <select
                  onChange={handleStatusChange}
                  defaultValue=""
                  className="mes-btn"
                  style={{ cursor: 'pointer', minWidth: 100 }}
                >
                  <option value="" disabled>상태변경</option>
                  <option value="불량">불량</option>
                  <option value="보류">보류</option>
                  <option value="반품">반품</option>
                  <option value="폐기">폐기</option>
                </select>
              )}
            </>
          }
        />
      </PageFilterShell>

      {/* 바코드 스캐너 모달 — fixed overlay, PageFilterShell 외부에 렌더링 */}
      {scannerOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: 20,
            width: 360, maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>바코드/QR 스캔</strong>
              <button onClick={handleStopScan} className="mes-btn mes-btn-delete" style={{ padding: '4px 12px' }}>
                닫기
              </button>
            </div>
            <div id="barcode-scanner-region" style={{ width: '100%' }} />
            <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              카메라에 바코드/QR을 비추면 자동으로 조회됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 마스터 검색 팝업 */}
      {searchPopup.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: 20,
            width: 500, maxWidth: '90vw', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>{searchPopup.field === 'materialCode' ? '자재 검색' : '업체 검색'}</strong>
              <button onClick={() => setSearchPopup((p) => ({ ...p, open: false }))}
                className="mes-btn mes-btn-delete" style={{ padding: '4px 12px' }}>닫기</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={searchPopup.keyword}
                onChange={(e) => setSearchPopup((p) => ({ ...p, keyword: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') doMasterSearch(searchPopup.field, searchPopup.keyword); }}
                placeholder="검색어 입력"
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4 }}
              />
              <button onClick={() => doMasterSearch(searchPopup.field, searchPopup.keyword)}
                className="mes-btn">검색</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {searchPopup.field === 'materialCode' ? (
                      <>
                        <th style={thStyle}>자재코드</th>
                        <th style={thStyle}>재질</th>
                        <th style={thStyle}>모델</th>
                        <th style={thStyle}>규격</th>
                      </>
                    ) : (
                      <>
                        <th style={thStyle}>업체코드</th>
                        <th style={thStyle}>업체명</th>
                        <th style={thStyle}>업종</th>
                        <th style={thStyle}>업태</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {searchPopup.results.map((item, idx) => (
                    <tr key={idx} onClick={() => handleSelectMaster(item)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                      {searchPopup.field === 'materialCode' ? (
                        <>
                          <td style={tdStyle}>{item.materialCode as string}</td>
                          <td style={tdStyle}>{item.materialType as string}</td>
                          <td style={tdStyle}>{item.modelName as string}</td>
                          <td style={tdStyle}>{item.productSpec as string}</td>
                        </>
                      ) : (
                        <>
                          <td style={tdStyle}>{item.partnerCode as string}</td>
                          <td style={tdStyle}>{item.partnerName as string}</td>
                          <td style={tdStyle}>{item.businessCategory as string}</td>
                          <td style={tdStyle}>{item.businessType as string}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {searchPopup.results.length === 0 && (
                    <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#999' }}>결과 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: '6px 10px', borderBottom: '1px solid #f3f4f6',
};
