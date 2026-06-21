import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'FR0010';

export default function FreightRatePage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="Playwright 스크래핑으로 수집한 선사별 운임(FCL/LCL)과 FREIGHT_INQUIRY 이메일에서 AI 파싱한 견적 데이터를 통합하여 운임 현황과 추이를 조회하는 화면"
        features={[
          '선사별·구간별(POL/POD) 최신 운임 조회 테이블',
          '운임 추이 차트 — 기간별 등락 시각화',
          'FREIGHT_INQUIRY 이메일 파싱 결과와 스크래핑 운임 비교',
          '운임 변동 알림: 기준 대비 ±X% 초과 시 Teams 알림',
          'Excel 내보내기 (구간별 운임 리포트)',
        ]}
        devItems={[
          'Python Playwright 스크래핑 — 선사 홈페이지/스팟 운임 페이지 정기 수집',
          'APScheduler (Python) — 스크래핑 배치 스케줄 관리',
          'B-7 AI 분류 (EmailClassifyService) — FREIGHT_INQUIRY 카테고리 이메일 파싱',
          'Teams Webhook — 운임 변동 임계값 초과 알림',
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
