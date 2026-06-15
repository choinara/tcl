import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ReceiptRow {
  no: number;
  date: string;
  time: string;
  location: string;
  purpose: string;
  detail: string;
  user: string;
  amount: number;
  submitter: string;
}

export interface ReceiptMeta {
  programName: string;
  shootingDate: string;
  pdName: string;
}

/* ── 스타일 상수 ── */

const BLACK_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD6E4F0' },
};

const SUM_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' },
};

const TYPE_SHORT: Record<string, string> = {
  expenses: '제수수료',
  facility: '시설장소',
  supplies: '소모품비',
  travel: '여비교통비',
};

const TYPE_LABELS: Record<string, string> = {
  expenses: '제수수료(가지급)',
  facility: '시설장소(가지급)',
  supplies: '소모품비(가지급)',
  travel: '여비교통비(가지급)',
};

const FONT = '맑은 고딕';
const MIN_DATA_ROWS = 5;

function buildReceiptSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: ReceiptRow[],
  meta: ReceiptMeta,
  receiptType: string,
): void {
  const isTravel = receiptType === 'travel';
  const typeShort = TYPE_SHORT[receiptType] || '여비교통비';

  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { width: 6 },   // A: NO
    { width: 14 },  // B: 일자
    { width: 10 },  // C: 시간
    { width: 28 },  // D: 이동장소 / 용도
    { width: 24 },  // E: 용도 / 내역
    { width: 14 },  // F: 사용자
    { width: 14 },  // G: 금 액
  ];

  /* Row 1: 타이틀 */
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `(가지급) 기타 내역서-${typeShort}`;
  titleCell.font = {
    name: FONT, bold: true, size: 16,
    underline: true, color: { argb: 'FF1A56DB' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  /* Rows 3–5: 기본정보 + 결재란 */
  let shootingStr = '';
  if (meta.shootingDate) {
    const parts = meta.shootingDate.split('-');
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    shootingStr = m > 0 ? `${y}년 ${m}월` : meta.shootingDate;
  }

  sheet.getCell('A3').value = `1. 프로그램명 : ${(meta.programName || '').normalize('NFC')}`;
  sheet.getCell('A3').font = { name: FONT, size: 10 };
  sheet.getCell('A4').value = `2. 촬영 일자 : ${shootingStr}`;
  sheet.getCell('A4').font = { name: FONT, size: 10 };
  sheet.getCell('A5').value = `3. 담당 PD : ${(meta.pdName || '').normalize('NFC')}`;
  sheet.getCell('A5').font = { name: FONT, size: 10 };

  // 결재란 (E3:G5)
  sheet.mergeCells('E3:E5');
  for (let r = 3; r <= 5; r++) sheet.getCell(`E${r}`).border = BLACK_BORDER;
  const approvalCell = sheet.getCell('E3');
  approvalCell.value = '결  재';
  approvalCell.font = { name: FONT, bold: true, size: 11 };
  approvalCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const pdHead = sheet.getCell('F3');
  pdHead.value = 'PD';
  pdHead.font = { name: FONT, bold: true, size: 10 };
  pdHead.alignment = { horizontal: 'center', vertical: 'middle' };
  pdHead.border = BLACK_BORDER;

  const cpHead = sheet.getCell('G3');
  cpHead.value = 'C P';
  cpHead.font = { name: FONT, bold: true, size: 10 };
  cpHead.alignment = { horizontal: 'center', vertical: 'middle' };
  cpHead.border = BLACK_BORDER;

  sheet.mergeCells('F4:F5');
  for (let r = 4; r <= 5; r++) sheet.getCell(`F${r}`).border = BLACK_BORDER;
  sheet.mergeCells('G4:G5');
  for (let r = 4; r <= 5; r++) sheet.getCell(`G${r}`).border = BLACK_BORDER;
  sheet.getRow(4).height = 22;
  sheet.getRow(5).height = 22;

  /* Row 7: 부제 */
  sheet.getCell('A7').value = `*${typeShort} 일지`;
  sheet.getCell('A7').font = { name: FONT, bold: true, size: 10 };

  /* Row 8: 테이블 헤더 */
  const headers = isTravel
    ? ['NO', '일자', '시간', '이동장소(촬영지 체크)', '용도(자세히)', '사용자', '금 액']
    : ['NO', '일자', '시간', '용도(자세히)', '내역', '사용자', '금 액'];

  const headerRow = sheet.getRow(8);
  headers.forEach((label, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: FONT, bold: true, size: 10 };
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BLACK_BORDER;
  });
  headerRow.height = 22;

  /* Data rows */
  const sorted = [...rows]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .map((r, i) => ({ ...r, no: i + 1 }));

  const dataCount = Math.max(sorted.length, MIN_DATA_ROWS);
  const DATA_START = 9;

  for (let i = 0; i < dataCount; i++) {
    const exRow = sheet.getRow(DATA_START + i);
    const row = sorted[i];

    if (row) {
      exRow.getCell(1).value = row.no;
      exRow.getCell(2).value = (row.date || '').replace(/-/g, '.').normalize('NFC');
      exRow.getCell(3).value = (row.time || '').normalize('NFC');
      if (isTravel) {
        exRow.getCell(4).value = (row.location || '').normalize('NFC');
        exRow.getCell(5).value = (row.purpose || '').normalize('NFC');
      } else {
        exRow.getCell(4).value = (row.purpose || '').normalize('NFC');
        exRow.getCell(5).value = (row.detail || '').normalize('NFC');
      }
      exRow.getCell(6).value = (row.user || '').normalize('NFC');
      exRow.getCell(7).value = row.amount;
      exRow.getCell(7).numFmt = '#,##0';
    }

    for (let c = 1; c <= 7; c++) {
      const cell = exRow.getCell(c);
      cell.border = BLACK_BORDER;
      cell.font = { name: FONT, size: 10 };
      cell.alignment = {
        horizontal: c === 7 ? 'right' : 'center',
        vertical: 'middle',
      };
    }
  }

  /* 합계 행 */
  const sumIdx = DATA_START + dataCount;
  const sumRow = sheet.getRow(sumIdx);

  sheet.mergeCells(`A${sumIdx}:F${sumIdx}`);
  for (let c = 1; c <= 6; c++) {
    const cell = sumRow.getCell(c);
    cell.fill = SUM_FILL;
    cell.border = BLACK_BORDER;
  }
  sumRow.getCell(1).value = '합계';
  sumRow.getCell(1).font = { name: FONT, bold: true, size: 11 };
  sumRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const amtCell = sumRow.getCell(7);
  amtCell.value = total;
  amtCell.numFmt = '₩#,##0';
  amtCell.font = { name: FONT, bold: true, size: 11 };
  amtCell.alignment = { horizontal: 'right', vertical: 'middle' };
  amtCell.fill = SUM_FILL;
  amtCell.border = BLACK_BORDER;

  sumRow.height = 24;
}

async function saveWorkbook(workbook: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as {
        showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
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
      if ((e as Error).name === 'AbortError') return;
    }
  }

  saveAs(blob, `${fileName}.xlsx`);
}

/** 단일 영수증구분 엑셀 내보내기 */
export async function exportReceiptExcel(
  rows: ReceiptRow[],
  meta: ReceiptMeta,
  fileName = '(가지급) 기타 내역서-여비교통비',
  receiptType = 'travel',
): Promise<void> {
  const typeLabel = TYPE_LABELS[receiptType] || '여비교통비(가지급)';
  const workbook = new ExcelJS.Workbook();
  buildReceiptSheet(workbook, typeLabel, rows, meta, receiptType);
  await saveWorkbook(workbook, fileName);
}

/**
 * 통합 엑셀 내보내기 — 영수증구분별 + 제출자별 시트 분리
 */
export async function exportConsolidatedReceiptExcel(
  allData: Record<string, ReceiptRow[]>,
  meta: ReceiptMeta,
  fileName: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const TYPE_ORDER = ['expenses', 'facility', 'supplies', 'travel'] as const;

  for (const typeKey of TYPE_ORDER) {
    const typeRows = allData[typeKey];
    if (!typeRows || typeRows.length === 0) continue;
    const typeLabel = TYPE_LABELS[typeKey] || typeKey;
    buildReceiptSheet(workbook, typeLabel, typeRows, meta, typeKey);
  }

  for (const typeKey of TYPE_ORDER) {
    const typeRows = allData[typeKey];
    if (!typeRows || typeRows.length === 0) continue;

    const bySubmitter = new Map<string, ReceiptRow[]>();
    for (const row of typeRows) {
      const sub = row.submitter || '미지정';
      if (!bySubmitter.has(sub)) bySubmitter.set(sub, []);
      bySubmitter.get(sub)!.push(row);
    }

    if (bySubmitter.size <= 1) continue;

    for (const [submitter, subRows] of bySubmitter) {
      let sName = `${TYPE_SHORT[typeKey] || typeKey}_${submitter}`;
      if (sName.length > 31) sName = sName.slice(0, 31);
      const numbered = subRows.map((r, i) => ({ ...r, no: i + 1 }));
      buildReceiptSheet(workbook, sName, numbered, meta, typeKey);
    }
  }

  await saveWorkbook(workbook, fileName);
}
