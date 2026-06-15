import * as XLSX from 'xlsx';

/**
 * 일별생산계획 엑셀 템플릿 생성 및 다운로드
 *
 * 구조: 고객 | Line | 제품명 | 규격 | 재질 | 실적구분 | 3개월 날짜 컬럼 (M/D)
 * - 1행: 헤더
 * - 2행~: 데이터 입력 영역 (계획/실적 쌍)
 */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** JS Date → Excel 시리얼 넘버 */
function dateToSerial(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  return Math.round(d.getTime() / 86400000) + 25569;
}

export function downloadDailyPlanTemplate(year: number, startMonth: number) {
  const ws = XLSX.utils.aoa_to_sheet([]);

  // 3개월 계산
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = year + Math.floor((startMonth - 1 + i) / 12);
    months.push({ year: y, month: m });
  }

  // 날짜 목록 생성
  const dates: { year: number; month: number; day: number; field: string }[] = [];
  for (let mIdx = 0; mIdx < 3; mIdx++) {
    const { year: yr, month: mo } = months[mIdx];
    const days = getDaysInMonth(yr, mo);
    for (let d = 1; d <= days; d++) {
      dates.push({ year: yr, month: mo, day: d, field: `m${mIdx}_d${d}` });
    }
  }

  const FIXED_HEADERS = ['고객', 'Line', '제품명', '규격', '재질', '실적구분'];
  const FIXED_COUNT = FIXED_HEADERS.length;

  // Row 0: 타이틀
  const titleRow = [`일별생산계획 ${year}년 ${months.map(m => m.month + '월').join('~')}`];
  XLSX.utils.sheet_add_aoa(ws, [titleRow], { origin: { r: 0, c: 0 } });

  // Row 1: 헤더 (고정 컬럼 + 날짜 컬럼)
  const headerRow: (string | number)[] = [...FIXED_HEADERS];
  for (const dt of dates) {
    headerRow.push(dateToSerial(dt.year, dt.month, dt.day));
  }
  XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: { r: 1, c: 0 } });

  // 날짜 셀에 M/D 포맷 적용
  for (let ci = FIXED_COUNT; ci < FIXED_COUNT + dates.length; ci++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: ci });
    if (ws[cellRef]) {
      ws[cellRef].t = 'n';
      ws[cellRef].z = 'M/D';
    }
  }

  // Row 2~: 샘플 데이터 행 (2세트, 각 계획+실적)
  const sampleProducts = [
    { customer: '', line: 'P1', prod: 'CQ', spec: '0.2*45', mat: '일반동' },
    { customer: '', line: 'P1', prod: 'AQ', spec: '0.2*45', mat: '무산소' },
  ];

  let row = 2;
  for (const sp of sampleProducts) {
    // 계획 행
    const planRow: (string | null)[] = [sp.customer, sp.line, sp.prod, sp.spec, sp.mat, '계획'];
    for (let i = 0; i < dates.length; i++) planRow.push(null);
    XLSX.utils.sheet_add_aoa(ws, [planRow], { origin: { r: row, c: 0 } });
    row++;

    // 실적 행
    const actualRow: (string | null)[] = [sp.customer, sp.line, sp.prod, sp.spec, sp.mat, '실적'];
    for (let i = 0; i < dates.length; i++) actualRow.push(null);
    XLSX.utils.sheet_add_aoa(ws, [actualRow], { origin: { r: row, c: 0 } });
    row++;
  }

  // 열 너비 설정
  const cols: XLSX.ColInfo[] = [
    { wch: 10 }, // 고객
    { wch: 6 },  // Line
    { wch: 8 },  // 제품명
    { wch: 10 }, // 규격
    { wch: 8 },  // 재질
    { wch: 8 },  // 실적구분
  ];
  for (let i = 0; i < dates.length; i++) cols.push({ wch: 7 });
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '일별생산계획');

  const monthLabel = months.map(m => m.month + '월').join('~');
  XLSX.writeFile(wb, `생산계획_템플릿_${year}년${monthLabel}.xlsx`);
}
