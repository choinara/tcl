import * as XLSX from 'xlsx';

/* ── Types ── */

export type Polarity = '음극' | '양극';

export interface ParsedOrderRow {
  polarity: Polarity;
  site: string;       // 'MP' | 'SLD'
  spec: string;       // 규격 (예: '0.2*45')
  material: string;   // 재질 (예: '일반동')
  category: string;   // 구분 (예: 'Demand')
  quantities: Record<number, number>;  // day → 수량
  excelTotal: number | null;           // 엑셀 Total 컬럼 값 (검증용)
  month: number;      // 해당 행의 월
}

export interface MonthData {
  month: number;
  year: number | null;
  rows: ParsedOrderRow[];
  totalMismatches: Array<{ label: string; excelTotal: number; calcTotal: number }>;
}

export interface ParseResult {
  /** 첫 번째 섹션의 월 (하위 호환) */
  month: number;
  year: number | null;
  /** 모든 행 (월 구분 없이) */
  rows: ParsedOrderRow[];
  warnings: string[];
  totalMismatches: Array<{ label: string; excelTotal: number; calcTotal: number }>;
  /** 월별 그룹 */
  byMonth: MonthData[];
}

/* ── Constants ── */

const SECTION_RE = /(\d+)\s*[月월]\s*\(?\s*(음극|양극)\s*\)?/;
/** 규격 패턴: 기본 "N*N" + 선택적 접미사 (H0), SK, LG 등 */
const SPEC_RE = /^\d+\.?\d*\s*\*\s*\d+\.?\d*/;
const VALID_MATERIALS = ['일반동', '무산소', '알루미늄'];
const SKIP_KEYWORDS = ['계', '합계', '소계'];
const SITE_MAP: Record<string, string> = {
  '성남': 'MP', 'MP': 'MP', 'mp': 'MP',
  '파주': 'SLD', 'SLD': 'SLD', 'sld': 'SLD', 'LT': 'SLD',
};

/* ── Helpers ── */

interface DateInfo { month: number; day: number; year?: number }

/** 규격 정규화: 줄바꿈 제거하여 한 줄로 합침 */
function normalizeSpec(raw: string): string {
  return String(raw).replace(/[\r\n]+/g, '').replace(/\s+/g, '').replace(/\*/, '*');
}

/** 재질 정규화: 줄바꿈 제거하여 한 줄로 합침, 괄호 포함 보존 */
function normalizeMaterial(raw: string): string {
  return String(raw).replace(/[\r\n]+/g, '').trim();
}

function parseCellNumber(val: unknown): number | null {
  if (val == null || val === '' || val === '-' || String(val).includes('#REF')) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function detectSite(text: string): string | null {
  for (const [keyword, code] of Object.entries(SITE_MAP)) {
    if (text.includes(keyword)) return code;
  }
  return null;
}

function isSkipRow(cells: unknown[]): boolean {
  const firstCell = String(cells[0] ?? '').trim();
  return SKIP_KEYWORDS.some((kw) => firstCell.includes(kw));
}

/** Excel 시리얼 넘버 → { year, month, day } */
function excelSerialToDate(serial: number): { year: number; month: number; day: number } | null {
  if (serial < 1 || serial > 100000) return null;
  const utcDays = serial - 25569;
  const date = new Date(utcDays * 86400000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/**
 * 헤더에서 날짜 컬럼 매핑: 월 필터 없이 모든 날짜를 {month, day}로 저장
 * - Excel 시리얼 넘버 → month/day 자동 추출
 * - "N일" 형식 → fallbackMonth 사용
 * - "M/D" 형식 → month/day 추출
 */
function buildDayColMap(
  headerRow: unknown[],
  fallbackMonth: number,
): { dayColMap: Map<number, DateInfo>; totalColIndex: number | null } {
  const dayColMap = new Map<number, DateInfo>();
  let totalColIndex: number | null = null;

  for (let ci = 0; ci < headerRow.length; ci++) {
    const cell = headerRow[ci];
    const cellStr = String(cell ?? '').trim();

    // "Total" 컬럼
    if (/^total$/i.test(cellStr)) {
      totalColIndex = ci;
      continue;
    }

    // Excel 시리얼 넘버 (숫자)
    if (typeof cell === 'number' && cell > 40000 && cell < 100000) {
      const d = excelSerialToDate(cell);
      if (d) {
        dayColMap.set(ci, { month: d.month, day: d.day, year: d.year });
      }
      continue;
    }

    // "N일" 형식 (예: "1일", "3일") — 월 정보 없으므로 fallbackMonth 사용
    const dayMatch = cellStr.match(/^(\d{1,2})\s*일$/);
    if (dayMatch) {
      dayColMap.set(ci, { month: fallbackMonth, day: parseInt(dayMatch[1], 10) });
      continue;
    }

    // "M/D" 형식
    const slashMatch = cellStr.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
    if (slashMatch) {
      dayColMap.set(ci, { month: parseInt(slashMatch[1], 10), day: parseInt(slashMatch[2], 10) });
    }
  }

  return { dayColMap, totalColIndex };
}

/* ── Main parser ── */

export function parseOrderExcel(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const result: ParseResult = {
    month: 0,
    year: null,
    rows: [],
    warnings: [],
    totalMismatches: [],
    byMonth: [],
  };

  let currentPolarity: Polarity | null = null;
  let currentSite: string | null = null;
  let dayColMap = new Map<number, DateInfo>();
  let totalColIndex: number | null = null;
  /** 섹션 헤더의 월 (fallback용으로만 사용) */
  let sectionMonth = 0;

  for (let ri = 0; ri < raw.length; ri++) {
    const row = raw[ri];
    if (!row || row.length === 0) continue;
    if (row.every((c) => c == null || String(c).trim() === '')) continue;

    const firstCell = String(row[0] ?? '').trim();

    // Step 1: 섹션 탐지 (극성/월)
    const sectionMatch = firstCell.match(SECTION_RE);
    if (sectionMatch) {
      const month = parseInt(sectionMatch[1], 10);
      const polarity = sectionMatch[2] as Polarity;
      if (month >= 1 && month <= 12) {
        sectionMonth = month;
        currentPolarity = polarity;
        currentSite = null;
        dayColMap = new Map();
        totalColIndex = null;
      }
      continue;
    }

    // Step 2: 날짜 헤더 행 ("규격" / "고객")
    if (/^규격$/.test(firstCell) || /^고객/.test(firstCell)) {
      const mapped = buildDayColMap(row, sectionMonth);
      if (mapped.dayColMap.size > 0) {
        dayColMap = mapped.dayColMap;
        totalColIndex = mapped.totalColIndex;

        // 첫 날짜 컬럼에서 month/year 추출하여 result에 반영
        const firstDate = dayColMap.values().next().value;
        if (firstDate && result.month === 0) {
          result.month = firstDate.month;
          result.year = firstDate.year ?? null;
        }

        // 이전 행(ri-1)에서 Total 컬럼 확인
        if (totalColIndex == null && ri > 0) {
          const prevRow = raw[ri - 1];
          if (prevRow) {
            for (let ci = 0; ci < prevRow.length; ci++) {
              if (/^total$/i.test(String(prevRow[ci] ?? '').trim())) {
                totalColIndex = ci;
                break;
              }
            }
          }
        }
      }
      continue;
    }

    // 거점 헤더 행
    const siteFromFirst = detectSite(firstCell);
    const isSiteHeaderRow = siteFromFirst
      && !SPEC_RE.test(normalizeSpec(firstCell))
      && (firstCell.includes('_') || firstCell.includes('사업부') || firstCell.length > 3);
    if (isSiteHeaderRow) {
      currentSite = siteFromFirst;
      for (let ci = 0; ci < row.length; ci++) {
        if (/^total$/i.test(String(row[ci] ?? '').trim())) {
          totalColIndex = ci;
        }
      }
      continue;
    }

    // "구분" 행 — 날짜 헤더 포함 시 dayColMap 구축
    if (/^구\s*분$/.test(firstCell)) {
      const mapped = buildDayColMap(row, sectionMonth);
      if (mapped.dayColMap.size > 0) {
        dayColMap = mapped.dayColMap;
        totalColIndex = mapped.totalColIndex;
      }
      continue;
    }

    // 소계/합계 행 스킵
    if (isSkipRow(row)) continue;

    // 극성/날짜 매핑 없으면 스킵
    if (!currentPolarity || dayColMap.size === 0) continue;

    // Step 3: 데이터 행 파싱
    let spec: string | null = null;
    let material: string | null = null;
    let category: string | null = null;
    let rowSite: string | null = currentSite;

    const siteInFirstCell = detectSite(firstCell);
    if (siteInFirstCell) {
      currentSite = siteInFirstCell;
      rowSite = siteInFirstCell;
    }

    for (let ci = 0; ci < Math.min(row.length, 6); ci++) {
      const rawCell = String(row[ci] ?? '').trim();
      if (!rawCell || rawCell === '-' || rawCell === '0') continue;

      const normalized = normalizeSpec(rawCell);
      if (SPEC_RE.test(normalized) && !spec) {
        spec = normalized;
      } else {
        const mat = normalizeMaterial(rawCell);
        if (VALID_MATERIALS.some((vm) => mat.startsWith(vm)) && !material) {
          material = mat;
        } else if (/demand/i.test(rawCell) && !category) {
          category = rawCell.replace(/[\r\n]+/g, '').trim();
        }
      }
    }

    if (!spec) continue;

    if (!rowSite) {
      result.warnings.push(`행 ${ri + 1}: 거점을 식별할 수 없음 (규격: ${spec})`);
      continue;
    }

    if (!material && currentPolarity === '양극') {
      material = '알루미늄';
    }

    if (!material) {
      result.warnings.push(`행 ${ri + 1}: 재질을 식별할 수 없음 (규격: ${spec})`);
      continue;
    }

    // 수량을 월별로 분리
    const quantitiesByMonth = new Map<number, Record<number, number>>();
    let calcTotal = 0;
    for (const [ci, dateInfo] of dayColMap) {
      const val = parseCellNumber(row[ci]);
      if (val != null && val > 0) {
        if (!quantitiesByMonth.has(dateInfo.month)) {
          quantitiesByMonth.set(dateInfo.month, {});
        }
        quantitiesByMonth.get(dateInfo.month)![dateInfo.day] = val;
        calcTotal += val;
      }
    }

    // Total 컬럼 값
    let excelTotal: number | null = null;
    if (totalColIndex != null) {
      excelTotal = parseCellNumber(row[totalColIndex]);
    }

    // 데이터가 없으면 sectionMonth 기준 빈 행 1건
    if (quantitiesByMonth.size === 0) {
      const m = sectionMonth || result.month || 1;
      quantitiesByMonth.set(m, {});
    }

    // 월별로 ParsedOrderRow 생성
    for (const [m, quantities] of quantitiesByMonth) {
      result.rows.push({
        polarity: currentPolarity,
        site: rowSite,
        spec,
        material,
        category: category || 'Demand',
        quantities,
        excelTotal,
        month: m,
      });
    }

    // Total 검증
    if (excelTotal != null && calcTotal !== excelTotal) {
      result.totalMismatches.push({
        label: `${currentPolarity} ${rowSite} ${spec} ${material}`,
        excelTotal,
        calcTotal,
      });
    }
  }

  // result.month: 첫 번째 날짜에서 추출 (이미 위에서 설정), fallback
  if (result.month === 0 && result.rows.length > 0) {
    result.month = result.rows[0].month;
  }

  // 월별 그룹 생성
  const monthMap = new Map<number, ParsedOrderRow[]>();
  for (const row of result.rows) {
    const m = row.month;
    if (!monthMap.has(m)) monthMap.set(m, []);
    monthMap.get(m)!.push(row);
  }
  // 월 순서대로 정렬
  const sortedMonths = [...monthMap.keys()].sort((a, b) => a - b);
  for (const m of sortedMonths) {
    const mRows = monthMap.get(m)!;
    const mismatches = result.totalMismatches.filter((tm) =>
      mRows.some((r) => `${r.polarity} ${r.site} ${r.spec} ${r.material}` === tm.label),
    );
    result.byMonth.push({ month: m, year: result.year, rows: mRows, totalMismatches: mismatches });
  }

  // Validation
  if (result.rows.length === 0) {
    result.warnings.unshift('파싱된 데이터 행이 없습니다. 올바른 수주 양식인지 확인하세요.');
  }
  if (result.month === 0) {
    result.warnings.unshift('월 정보를 식별할 수 없습니다.');
  }

  return result;
}
