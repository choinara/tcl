import type { ColDef, GridApi } from 'ag-grid-community';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExcelExportParams<T = unknown> {
  api: GridApi<T>;
  columnDefs: ColDef<T>[];
  fileName?: string;
  sheetName?: string;
}

/**
 * ExcelJS 기반 .xlsx 내보내기
 * showSaveFilePicker 지원 시 저장 위치 선택 다이얼로그 표시
 * Enterprise 전환 시 → api.exportDataAsExcel() 로 교체
 */
export async function exportToExcel<T = unknown>({
  api,
  columnDefs,
  fileName = 'export',
  sheetName = 'Sheet1',
}: ExcelExportParams<T>): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // 헤더 정의 필터링 (field가 있는 컬럼만)
  const visibleCols = columnDefs.filter((c) => c.field && !c.hide);

  // 컬럼 설정
  sheet.columns = visibleCols.map((col) => ({
    header: String(col.headerName || col.field || ''),
    key: col.field!,
    width: Math.max(((col.width || 120) / 7), 10),
  }));

  // 헤더 스타일
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.font = { bold: true, size: 10, color: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  // 데이터 행 추가
  const rowData: Record<string, unknown>[] = [];
  api.forEachNodeAfterFilterAndSort((node) => {
    if (node.data) rowData.push(node.data as Record<string, unknown>);
  });

  rowData.forEach((data) => {
    const row: Record<string, unknown> = {};
    visibleCols.forEach((col) => {
      const field = col.field!;
      let value = data[field];

      // 숫자 타입 처리
      if (col.type === 'numericColumn' && value != null) {
        value = Number(value);
      }

      row[field] = value;
    });
    sheet.addRow(row);
  });

  // 숫자 컬럼 포맷 적용
  visibleCols.forEach((col, idx) => {
    if (col.type === 'numericColumn') {
      const colNum = idx + 1;
      sheet.getColumn(colNum).numFmt = '#,##0';
      sheet.getColumn(colNum).alignment = { horizontal: 'right' };
    }
  });

  // 파일 저장
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // showSaveFilePicker 지원 시 저장 위치 선택 다이얼로그
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: `${fileName}.xlsx`,
        types: [{
          description: 'Excel Files',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(buffer);
      await writable.close();
      return;
    } catch (e) {
      // 사용자가 취소한 경우
      if ((e as Error).name === 'AbortError') return;
      // 기타 오류 → fallback
    }
  }

  // Fallback: 브라우저 기본 다운로드
  saveAs(blob, `${fileName}.xlsx`);
}
