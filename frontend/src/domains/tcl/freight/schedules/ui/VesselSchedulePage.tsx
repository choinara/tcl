import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'FR0020';

export default function VesselSchedulePage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="Playwright 스크래핑으로 수집한 선박 스케줄(ETD/ETA)을 구간·선사·선박명 기준으로 조회하고, 스케줄 변경 감지 시 담당자에게 즉시 알림하는 화면"
        features={[
          '구간별(POL→POD) 선박 스케줄 목록 — ETD·ETA·Transit Time 표시',
          '스케줄 변경 감지: 전일 대비 ETD/ETA 변동 하이라이트',
          '변경 알림: Teams Webhook + 이메일 자동발송 (BOOKING 카테고리 연계)',
          '선사별 스케줄 필터 및 Transit Time 기준 정렬',
          '스케줄 캘린더 뷰 — 주간·월간 입출항 일정 시각화',
        ]}
        devItems={[
          'Python Playwright 스크래핑 — 선사 스케줄 페이지 정기 수집',
          'APScheduler (Python) — 스케줄 수집 배치 (일 1~2회)',
          'B-7 AI 분류 — BOOKING 이메일과 스케줄 데이터 연계',
          'Teams Webhook — ETD/ETA 변경 감지 즉시 알림',
        ]}
      />
    </div>
  );
}

function PlaceholderInfo({ purpose, features, devItems }: {
  purpose: string;
  features: string[];
  devItems: string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
      <Card title="메뉴 목적" color="#3b82f6">
        <p style={{ margin: 0, lineHeight: 1.7 }}>{purpose}</p>
      </Card>
      <Card title="To-Be 주요 기능" color="#10b981">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 2 }}>
          {features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </Card>
      <Card title="개발 리스트 연관 항목" color="#8b5cf6">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 2 }}>
          {devItems.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </Card>
      <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderRadius: 8, color: '#64748b', fontSize: 13 }}>
        현재 개발 준비 중인 메뉴입니다. 기능 구현 후 이 안내 화면은 실제 콘텐츠로 교체됩니다.
      </div>
    </div>
  );
}

function Card({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div style={{ background: color, padding: '0.5rem 1rem', fontWeight: 600, fontSize: 14, color: '#ffffff' }}>{title}</div>
      <div style={{ padding: '1rem', fontSize: 14, color: '#334155' }}>{children}</div>
    </div>
  );
}
