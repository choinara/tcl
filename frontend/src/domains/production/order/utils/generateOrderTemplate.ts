import * as XLSX from 'xlsx';

/**
 * 수주등록 엑셀 업로드 템플릿 생성 및 다운로드
 *
 * - 시작월~종료월 범위의 날짜 컬럼을 연속 생성
 * - 날짜 헤더는 Excel Date 시리얼 넘버로 출력 → 파서가 월/일을 정확히 인식
 */
export function downloadOrderTemplate(year: number, startMonth: number, endMonth: number) {
  const ws = XLSX.utils.aoa_to_sheet([]);

  // 날짜 목록 생성 (startMonth/1 ~ endMonth/말일)
  const dates: { month: number; day: number }[] = [];
  for (let m = startMonth; m <= endMonth; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push({ month: m, day: d });
    }
  }

  let row = 0;

  // ── 음극 섹션 ──
  row = writeSection(ws, row, year, startMonth, endMonth, '음극', dates, ['일반동', '무산소']);

  row += 2;

  // ── 양극 섹션 ──
  row = writeSection(ws, row, year, startMonth, endMonth, '양극', dates, ['알루미늄']);

  // 열 너비 설정
  const cols: XLSX.ColInfo[] = [
    { wch: 12 }, // 규격
    { wch: 10 }, // 재질
    { wch: 10 }, // 구분
  ];
  for (let i = 0; i < dates.length; i++) cols.push({ wch: 7 });
  cols.push({ wch: 9 }); // Total
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '수주등록');

  const monthLabel = startMonth === endMonth
    ? `${startMonth}월`
    : `${startMonth}월~${endMonth}월`;
  XLSX.writeFile(wb, `수주등록_템플릿_${year}년${monthLabel}.xlsx`);
}

/** JS Date → Excel 시리얼 넘버 */
function dateToSerial(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  return Math.round(d.getTime() / 86400000) + 25569;
}

function writeSection(
  ws: XLSX.WorkSheet,
  startRow: number,
  year: number,
  startMonth: number,
  endMonth: number,
  polarity: '음극' | '양극',
  dates: { month: number; day: number }[],
  materials: string[],
): number {
  let row = startRow;

  // 섹션 헤더
  const monthLabel = startMonth === endMonth
    ? `${startMonth}월 (${polarity})`
    : `${startMonth}~${endMonth}월 (${polarity})`;
  XLSX.utils.sheet_add_aoa(ws, [[monthLabel]], { origin: { r: row, c: 0 } });
  row++;

  const sites = polarity === '음극'
    ? [{ label: '성남_MP', code: 'MP' }, { label: '파주_SLD', code: 'SLD' }]
    : [{ label: '성남_MP', code: 'MP' }];

  for (const site of sites) {
    // 거점 헤더
    XLSX.utils.sheet_add_aoa(ws, [[site.label]], { origin: { r: row, c: 0 } });
    row++;

    // 규격 헤더 + 날짜 컬럼 (Excel 시리얼 넘버)
    const headerRow: (string | number)[] = ['규격', '재질', '구분'];
    for (const dt of dates) {
      headerRow.push(dateToSerial(year, dt.month, dt.day));
    }
    headerRow.push('Total');
    XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: { r: row, c: 0 } });

    // 날짜 셀에 날짜 포맷 적용
    for (let ci = 3; ci < 3 + dates.length; ci++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: ci });
      if (ws[cellRef]) {
        ws[cellRef].t = 'n';
        ws[cellRef].z = 'M/D';
      }
    }
    row++;

    // 샘플 데이터 행 (재질별 2행)
    for (const mat of materials) {
      for (let i = 0; i < 2; i++) {
        const dataRow: (string | null)[] = ['0.2*45', mat, 'Demand'];
        for (let d = 0; d < dates.length; d++) dataRow.push(null);
        dataRow.push(null); // Total
        XLSX.utils.sheet_add_aoa(ws, [dataRow], { origin: { r: row, c: 0 } });
        row++;
      }
    }
  }

  return row;
}
