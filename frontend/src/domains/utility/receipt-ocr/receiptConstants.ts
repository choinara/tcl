export interface GridRow {
  id: string | number;
  date: string;
  time: string;
  location: string;
  purpose: string;
  detail: string;
  user: string;
  amount: number;
  submitter: string;
  receiptTypeLabel: string;
}

export interface UploadedFile {
  file: File;
  preview: string;
  isPdf: boolean;
  error?: string;
}

export const RECEIPT_TYPES = [
  { value: 'expenses', label: '제수수료(가지급)' },
  { value: 'facility', label: '시설장소(가지급)' },
  { value: 'supplies', label: '소모품비(가지급)' },
  { value: 'travel', label: '여비교통비(가지급)' },
] as const;

export const TYPE_SHORT_LABELS: Record<string, string> = {
  expenses: '제수수료',
  facility: '시설장소',
  supplies: '소모품비',
  travel: '여비교통비',
};

/** 표시 라벨 → receiptType 값 역매핑 */
export const LABEL_TO_TYPE: Record<string, string> = {
  '제수수료': 'expenses',
  '시설장소': 'facility',
  '소모품비': 'supplies',
  '여비교통비': 'travel',
  '제수수료(가지급)': 'expenses',
  '시설장소(가지급)': 'facility',
  '소모품비(가지급)': 'supplies',
  '여비교통비(가지급)': 'travel',
};

let rowIdCounter = 0;
export function generateId(): string {
  return `receipt_${Date.now()}_${++rowIdCounter}`;
}

/** transaction_date에서 시간 부분 추출 ("2026-02-26 12:03" → "12:03") */
export function extractTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
}

/** transaction_date에서 날짜 부분만 추출 ("2026-02-26 12:03" → "2026-02-26") */
export function extractDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

/** DB 응답 → GridRow 매핑 */
export function toGridRow(r: Record<string, unknown>): GridRow {
  let label = (r.receiptTypeLabel as string) ?? '';
  if (!label && r.receiptType) {
    label = TYPE_SHORT_LABELS[r.receiptType as string] ?? '';
  }
  return {
    id: r.id as number,
    date: (r.receiptDate as string) ?? '',
    time: (r.receiptTime as string) ?? '',
    location: (r.location as string) ?? '',
    purpose: (r.purpose as string) ?? '',
    detail: (r.detail as string) ?? '',
    user: (r.userName as string) ?? '',
    amount: (r.amount as number) ?? 0,
    submitter: (r.submitter as string) ?? '',
    receiptTypeLabel: label,
  };
}

/** 현재 YYYY-MM */
export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── 고정값 localStorage 키 ──
const PIN_STORAGE_KEY = 'receipt-pinned-values';

export interface PinnedValues {
  programName?: string;
  pdName?: string;
  shootingDate?: string;
}

export function loadPinnedValues(): PinnedValues {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage JSON 파싱 실패 — 기본값({}) 반환, 고정값은 재설정 가능 */ }
  return {};
}

export function savePinnedValues(values: PinnedValues) {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(values));
}
