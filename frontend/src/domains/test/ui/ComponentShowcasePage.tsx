import { useMemo, useState, type ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { usePermission } from '@/hooks/usePermission';
import { useDateRange } from '@/hooks/useDateRange';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/ToastProvider';

// Layout
import { PageFilterShell } from '@/components/layout/PageFilterShell';
import { TabPanel } from '@/components/ui/TabPanel';
import { SplitPanel } from '@/components/ui/SplitPanel';

// Grid
import { PeakEditGrid } from '@/components/grid';

// Filter Presets (Row 1)
import { TabFilter } from '@/components/ui/TabFilter';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { FilterField } from '@/components/ui/FilterField';

// Filter Presets (추가)
import { KeywordFilter } from '@/components/ui/KeywordFilter';
import { MonthRangeFilter } from '@/components/ui/MonthRangeFilter';
import { SingleDateFilter } from '@/components/ui/SingleDateFilter';
import { MonthFilter } from '@/components/ui/MonthFilter';

// Action Buttons
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ExcelUploadButton } from '@/components/ui/ExcelUploadButton';
import { TemplateDownloadButton } from '@/components/ui/TemplateDownloadButton';

// Date/Period Inputs
import { DateInput } from '@/components/ui/DateInput';
import { DateRangeInput } from '@/components/ui/DateRangeInput';
import { MonthInput } from '@/components/ui/MonthInput';
import { YearMonthPicker } from '@/components/ui/YearMonthPicker';

// SearchBar
import { MonthlySearchBar } from '@/components/ui/MonthlySearchBar';
import { YearMonthRangeSearchBar } from '@/components/ui/YearMonthRangeSearchBar';
import { DateModeRangeSearchBar } from '@/components/ui/DateModeRangeSearchBar';

// Modal / Overlay
import { Modal } from '@/components/ui/Modal';
import { SearchCriteria } from '@/components/ui/SearchCriteria';

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: '전체', value: '' },
  { label: '처리중', value: 'active' },
  { label: '완료', value: 'done' },
  { label: '보류', value: 'hold' },
];

const CATEGORY_OPTIONS = [
  { value: 'raw', label: '원자재' },
  { value: 'sub', label: '부자재' },
  { value: 'fin', label: '완제품' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '처리중' },
  { value: 'done', label: '완료' },
  { value: 'hold', label: '보류' },
];

const PROCESS_OPTIONS = [
  { value: 'p1', label: '1공정' },
  { value: 'p2', label: '2공정' },
  { value: 'p3', label: '3공정' },
];

const TYPE_OPTIONS = [
  { value: 'a', label: 'A유형' },
  { value: 'b', label: 'B유형' },
  { value: 'c', label: 'C유형' },
];

const PERIOD_OPTIONS = ['1개월', '3개월', '6개월'] as const;

const DATE_MODE_OPTIONS = ['일별', '월별'] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
      {children}
    </span>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function generateMockData() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    code: `ITEM-${String(i + 1).padStart(3, '0')}`,
    name: `샘플 품목 ${i + 1}`,
    category: ['원자재', '부자재', '완제품'][i % 3],
    status: ['처리중', '완료', '보류'][i % 3],
    qty: Math.floor(Math.random() * 500) + 10,
    date: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
    remark: i % 4 === 0 ? `비고 ${i + 1}` : '',
  }));
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ComponentShowcasePage() {
  const perm = usePermission('TS0010');
  const { notify } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  // Row 1 toolbar state
  const [activeTab, setActiveTab] = useState('');
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useDateRange();
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [process, setProcess] = useState('');
  const [type, setType] = useState('');

  // 추가 필터 프리셋
  const [keyword, setKeyword] = useState('');
  const now = new Date();
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(now.getMonth() + 1);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [singleDate, setSingleDate] = useState(now.toISOString().slice(0, 10));
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);

  // 날짜 입력
  const [dateVal, setDateVal] = useState(now.toISOString().slice(0, 10));
  const [dateFrom2, setDateFrom2] = useState(now.toISOString().slice(0, 10));
  const [dateTo2, setDateTo2] = useState(now.toISOString().slice(0, 10));
  const [monthVal, setMonthVal] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [ymYear, setYmYear] = useState(now.getFullYear());
  const [ymMonth, setYmMonth] = useState(now.getMonth() + 1);

  // SearchBar
  const [sbYear, setSbYear] = useState(now.getFullYear());
  const [sbMonth, setSbMonth] = useState(now.getMonth() + 1);
  const [sbPeriod, setSbPeriod] = useState<'1개월' | '3개월' | '6개월'>('1개월');
  const [rngFrom, setRngFrom] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [rngTo, setRngTo] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [dmMode, setDmMode] = useState<'일별' | '월별'>('일별');
  const [dmFrom, setDmFrom] = useState(now.toISOString().slice(0, 10));
  const [dmTo, setDmTo] = useState(now.toISOString().slice(0, 10));

  // 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [scKeyword, setScKeyword] = useState('');

  // 그리드
  const mockData = useMemo(() => generateMockData(), []);
  const columns = useMemo<ColDef[]>(() => [
    { field: 'code', headerName: '코드', width: 120 },
    { field: 'name', headerName: '품목명', flex: 1, minWidth: 140 },
    { field: 'category', headerName: '구분', width: 90 },
    { field: 'status', headerName: '상태', width: 80 },
    { field: 'qty', headerName: '수량', width: 75, type: 'numericColumn' },
    { field: 'date', headerName: '일자', width: 100 },
    { field: 'remark', headerName: '비고', flex: 1 },
  ], []);

  return (
    <>
      <PageFilterShell
        title="공통 컴포넌트 쇼케이스"
        toolbar={
          <>
            <TabFilter tabs={STATUS_TABS} value={activeTab} onChange={setActiveTab} />
            <DateRangeFilter
              label="기간"
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
            <FilterField label="필터링:">
              <div style={{ display: 'flex', gap: 2 }}>
                <DropdownFilter options={CATEGORY_OPTIONS} value={category} onChange={setCategory} allLabel="구분 전체" width={100} />
                <DropdownFilter options={STATUS_OPTIONS} value={status} onChange={setStatus} allLabel="상태 전체" width={100} />
                <DropdownFilter options={PROCESS_OPTIONS} value={process} onChange={setProcess} allLabel="공정 전체" width={100} />
                <DropdownFilter options={TYPE_OPTIONS} value={type} onChange={setType} allLabel="유형 전체" width={100} />
              </div>
            </FilterField>
          </>
        }
        toolbarRight={
          <>
            <RefreshButton onRefresh={() => new Promise((r) => setTimeout(r, 800))} />
            <TemplateDownloadButton templateUrl="/api/test/template" fileName="sample_template.xlsx" />
            <ExcelUploadButton uploadUrl="/api/test/upload" onSuccess={() => {}} />
          </>
        }
      >
        <div style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>

          {/* ── 그리드 ───────────────────────────────────────── */}
          <Section title="그리드 — PeakEditGrid">
            <PeakEditGrid
              data={mockData}
              columns={columns}
              bodyHeight={240}
              onBatchSave={async () => {}}
              permission={perm}
            />
          </Section>

          {/* ── 추가 필터 프리셋 ──────────────────────────────── */}
          <Section title="추가 필터 프리셋 (Row 1 선택 사용)">
            <Row>
              <Item label="KeywordFilter">
                <KeywordFilter label="검색어" value={keyword} onChange={setKeyword} placeholder="품목코드/품목명" />
              </Item>
              <Item label="MonthRangeFilter">
                <MonthRangeFilter
                  label="기준기간"
                  fromYear={fromYear} fromMonth={fromMonth}
                  toYear={toYear} toMonth={toMonth}
                  onFromChange={(y, m) => { setFromYear(y); setFromMonth(m); }}
                  onToChange={(y, m) => { setToYear(y); setToMonth(m); }}
                />
              </Item>
              <Item label="SingleDateFilter">
                <SingleDateFilter label="기준일" value={singleDate} onChange={setSingleDate} />
              </Item>
              <Item label="MonthFilter">
                <MonthFilter label="기준월" year={filterYear} month={filterMonth} onChange={(y, m) => { setFilterYear(y); setFilterMonth(m); }} />
              </Item>
            </Row>
          </Section>

          {/* ── 날짜/기간 입력 ────────────────────────────────── */}
          <Section title="날짜/기간 입력 컴포넌트">
            <Row>
              <Item label="DateInput">
                <DateInput value={dateVal} onChange={setDateVal} />
              </Item>
              <Item label="DateRangeInput">
                <DateRangeInput
                  dateFrom={dateFrom2} dateTo={dateTo2}
                  onDateFromChange={setDateFrom2} onDateToChange={setDateTo2}
                />
              </Item>
              <Item label="MonthInput">
                <MonthInput value={monthVal} onChange={setMonthVal} />
              </Item>
              <Item label="YearMonthPicker">
                <YearMonthPicker year={ymYear} month={ymMonth} onChange={(y, m) => { setYmYear(y); setYmMonth(m); }} />
              </Item>
            </Row>
          </Section>

          {/* ── 검색바 ───────────────────────────────────────── */}
          <Section title="검색바 컴포넌트 (자체 조회 버튼 포함)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Item label="MonthlySearchBar">
                <MonthlySearchBar
                  year={sbYear} month={sbMonth}
                  onYearMonthChange={(y, m) => { setSbYear(y); setSbMonth(m); }}
                  period={sbPeriod} periodOptions={PERIOD_OPTIONS}
                  onPeriodChange={setSbPeriod}
                  onSearch={() => {}}
                />
              </Item>
              <Item label="YearMonthRangeSearchBar">
                <YearMonthRangeSearchBar
                  fromYear={rngFrom.year} fromMonth={rngFrom.month}
                  onFromChange={(y, m) => setRngFrom({ year: y, month: m })}
                  toYear={rngTo.year} toMonth={rngTo.month}
                  onToChange={(y, m) => setRngTo({ year: y, month: m })}
                  onSearch={() => {}}
                />
              </Item>
              <Item label="DateModeRangeSearchBar">
                <DateModeRangeSearchBar
                  dateMode={dmMode}
                  dateModeOptions={DATE_MODE_OPTIONS}
                  onDateModeChange={(v) => setDmMode(v as '일별' | '월별')}
                  dateFrom={dmFrom} onDateFromChange={setDmFrom}
                  dateTo={dmTo} onDateToChange={setDmTo}
                  onSearch={() => {}}
                />
              </Item>
            </div>
          </Section>

          {/* ── SearchCriteria ───────────────────────────────── */}
          <Section title="SearchCriteria (조회조건 래퍼 — 조회/초기화 버튼 포함)">
            <SearchCriteria onSearch={() => {}} onReset={() => setScKeyword('')}>
              <KeywordFilter label="검색어" value={scKeyword} onChange={setScKeyword} placeholder="품목명" />
              <DropdownFilter label="구분" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} allLabel="구분 전체" width={100} />
            </SearchCriteria>
          </Section>

          {/* ── 레이아웃 ─────────────────────────────────────── */}
          <Section title="레이아웃 컴포넌트">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Item label="TabPanel">
                <TabPanel
                  tabs={[
                    { key: 'a', label: '탭 A', content: <div style={{ padding: 12, fontSize: 13 }}>탭 A 콘텐츠 영역입니다.</div> },
                    { key: 'b', label: '탭 B', content: <div style={{ padding: 12, fontSize: 13 }}>탭 B 콘텐츠 영역입니다.</div> },
                    { key: 'c', label: '탭 C', content: <div style={{ padding: 12, fontSize: 13 }}>탭 C 콘텐츠 영역입니다.</div> },
                  ]}
                />
              </Item>
              <Item label="SplitPanel">
                <SplitPanel
                  height="120px"
                  left={
                    <div style={{ height: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: 10, fontSize: 13 }}>
                      좌측 패널 (45%)
                    </div>
                  }
                  right={
                    <div style={{ height: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: 10, fontSize: 13 }}>
                      우측 패널
                    </div>
                  }
                />
              </Item>
            </div>
          </Section>

          {/* ── 모달 / 다이얼로그 ─────────────────────────────── */}
          <Section title="모달 / 다이얼로그">
            <Row>
              <Item label="Modal">
                <button className="mes-btn" onClick={() => setModalOpen(true)}>모달 열기</button>
              </Item>
              <Item label="useConfirm">
                <button
                  className="mes-btn"
                  onClick={() =>
                    confirm('선택한 항목을 삭제하시겠습니까?').then((ok) => {
                      if (ok) notify('삭제가 확인되었습니다.', { type: 'success' });
                    })
                  }
                >
                  확인 다이얼로그
                </button>
              </Item>
            </Row>
          </Section>

          {/* ── 버튼 스타일 ───────────────────────────────────── */}
          <Section title="버튼 스타일 (mes-btn 클래스)">
            <Row>
              <Item label="기본 (mes-btn)">
                <button className="mes-btn">기본 버튼</button>
              </Item>
              <Item label="저장 (mes-btn-save)">
                <button className="mes-btn mes-btn-save">저장</button>
              </Item>
              <Item label="삭제 (mes-btn-delete)">
                <button className="mes-btn mes-btn-delete">삭제</button>
              </Item>
              <Item label="비활성">
                <button className="mes-btn" disabled>비활성</button>
              </Item>
            </Row>
          </Section>

        </div>
      </PageFilterShell>

      <ConfirmDialog />

      {/* ── Modal (오버레이) ──────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="모달 예시">
        <div style={{ padding: '8px 0', fontSize: 13 }}>
          Modal 컴포넌트입니다. size props: 기본 / wide / compact
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="mes-btn" onClick={() => setModalOpen(false)}>닫기</button>
          <button className="mes-btn mes-btn-save" onClick={() => setModalOpen(false)}>확인</button>
        </div>
      </Modal>
    </>
  );
}
