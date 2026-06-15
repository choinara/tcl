import * as XLSX from 'xlsx';

/**
 * 일별생산계획 엑셀 파서
 *
 * 템플릿 구조:
 *   Row 0: 타이틀 (파싱 대상 아님 — skip)
 *   Row 1: 헤더 — 고객 | Line | 제품명 | 규격 | 재질 | 실적구분 | 날짜 컬럼들 (M/D 또는 Excel 시리얼)
 *   Row 2~: 데이터
 */

export interface ParsedDailyPlanRow {
  customer: string;
  lineCode: string;
  productName: string;
  spec: string;
  material: string;
  planType: '계획' | '실적';
  /** field → value (m0_d1, m0_d2, ..., m2_d31) */
  quantities: Record<string, number>;
}

export interface DailyPlanParseResult {
  rows: ParsedDailyPlanRow[];
  warnings: string[];
  /** 파싱된 시작월 (첫 날짜 컬럼 기준) */
  startMonth: number;
  startYear: number;
}

interface DateInfo {
  year: number;
  month: number;
  day: number;
}

/** Excel 시리얼 넘버 → Date */
function excelSerialToDate(serial: number): DateInfo | null {
  if (serial < 1 || serial > 100000) return null;
  const utcDays = serial - 25569;
  const date = new Date(utcDays * 86400000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function parseCellNumber(val: unknown): number | null {
  if (val == null || val === '' || val === '-') return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
}

export function parseDailyPlanExcel(buffer: ArrayBuffer): DailyPlanParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const result: DailyPlanParseResult = {
    rows: [],
    warnings: [],
    startMonth: 0,
    startYear: 0,
  };

  if (raw.length < 2) {
    result.warnings.push('데이터가 없습니다.');
    return result;
  }

  // 헤더 행 찾기: "고객" 또는 "Line" 포함된 행
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(raw.length, 5); i++) {
    const row = raw[i];
    if (!row) continue;
    const firstCells = row.slice(0, 6).map(c => String(c ?? '').trim());
    if (firstCells.includes('고객') || firstCells.includes('Line') || firstCells.includes('제품명')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx < 0) {
    // 헤더가 없으면 1행을 헤더로 간주
    headerRowIdx = 1;
  }

  const headerRow = raw[headerRowIdx];
  if (!headerRow) {
    result.warnings.push('헤더 행을 찾을 수 없습니다.');
    return result;
  }

  // 고정 컬럼 인덱스 찾기
  const fixedMap: Record<string, number> = {};
  const fixedKeys = ['고객', 'Line', '제품명', '규격', '재질', '실적구분'];
  for (let ci = 0; ci < Math.min(headerRow.length, 10); ci++) {
    const h = String(headerRow[ci] ?? '').trim();
    if (fixedKeys.includes(h)) {
      fixedMap[h] = ci;
    }
  }

  // 날짜 컬럼 매핑: col index → DateInfo
  const dateColMap = new Map<number, DateInfo>();
  const fixedMaxCol = Math.max(...Object.values(fixedMap), 5);

  for (let ci = fixedMaxCol + 1; ci < headerRow.length; ci++) {
    const cell = headerRow[ci];
    if (cell == null) continue;

    // Excel 시리얼 넘버
    if (typeof cell === 'number' && cell > 40000 && cell < 100000) {
      const d = excelSerialToDate(cell);
      if (d) dateColMap.set(ci, d);
      continue;
    }

    // M/D 형식
    const cellStr = String(cell).trim();
    const slashMatch = cellStr.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10);
      const day = parseInt(slashMatch[2], 10);
      // year는 나중에 결정
      dateColMap.set(ci, { year: 0, month, day });
    }
  }

  if (dateColMap.size === 0) {
    result.warnings.push('날짜 컬럼을 찾을 수 없습니다. 템플릿 양식을 확인하세요.');
    return result;
  }

  // 3개월 범위 결정
  const allMonths = [...new Set([...dateColMap.values()].map(d => d.month))].sort((a, b) => a - b);
  const startMonth = allMonths[0];
  const firstDate = [...dateColMap.values()].find(d => d.month === startMonth);
  const startYear = firstDate?.year && firstDate.year > 2000 ? firstDate.year : new Date().getFullYear();

  result.startMonth = startMonth;
  result.startYear = startYear;

  // 3개월 매핑: (month, day) → field (m0_d1, m1_d1, ...)
  const threeMonths: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + Math.floor((startMonth - 1 + i) / 12);
    threeMonths.push({ year: y, month: m });
  }

  function monthDayToField(month: number, day: number): string | null {
    for (let mIdx = 0; mIdx < threeMonths.length; mIdx++) {
      if (threeMonths[mIdx].month === month) {
        return `m${mIdx}_d${day}`;
      }
    }
    return null;
  }

  // 데이터 행 파싱
  for (let ri = headerRowIdx + 1; ri < raw.length; ri++) {
    const row = raw[ri];
    if (!row || row.every(c => c == null || String(c).trim() === '')) continue;

    const customer = String(row[fixedMap['고객'] ?? 0] ?? '').trim();
    const lineCode = String(row[fixedMap['Line'] ?? 1] ?? '').trim();
    const productName = String(row[fixedMap['제품명'] ?? 2] ?? '').trim();
    const spec = String(row[fixedMap['규격'] ?? 3] ?? '').trim();
    const material = String(row[fixedMap['재질'] ?? 4] ?? '').trim();
    const planTypeRaw = String(row[fixedMap['실적구분'] ?? 5] ?? '').trim();

    // 필수 필드 체크
    if (!productName && !spec && !lineCode) continue;
    // 소계/합계 행 스킵
    if (['계', '합계', '소계'].some(kw => productName.includes(kw) || material.includes(kw))) continue;

    const planType: '계획' | '실적' = planTypeRaw === '실적' ? '실적' : '계획';

    const quantities: Record<string, number> = {};
    for (const [ci, dateInfo] of dateColMap) {
      const val = parseCellNumber(row[ci]);
      if (val != null && val !== 0) {
        const field = monthDayToField(dateInfo.month, dateInfo.day);
        if (field) quantities[field] = val;
      }
    }

    result.rows.push({
      customer,
      lineCode,
      productName,
      spec,
      material,
      planType,
      quantities,
    });
  }

  if (result.rows.length === 0) {
    result.warnings.push('파싱된 데이터 행이 없습니다. 양식을 확인하세요.');
  }

  return result;
}
