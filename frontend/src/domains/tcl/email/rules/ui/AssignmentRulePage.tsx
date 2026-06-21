import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'EM0040';

export default function AssignmentRulePage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="AI 분류 카테고리별 담당자 배정 룰을 관리하고, 키워드·발신자 기반 수동 오버라이드 규칙 및 Teams Webhook 알림 대상을 설정하는 운영 설정 화면"
        features={[
          '카테고리별 담당자 매핑 (FREIGHT_INQUIRY → 운임팀, BOOKING → 예약팀 등)',
          '키워드 룰: 특정 키워드 포함 시 지정 담당자로 강제 배정',
          '발신자 도메인 룰: 주요 거래처 이메일 도메인별 우선 배정',
          'Teams Webhook 알림 대상 설정 (카테고리별 채널 분리)',
          '룰 우선순위 조정 및 테스트 — 샘플 이메일로 배정 결과 시뮬레이션',
        ]}
        devItems={[
          'B-7 AI 분류 (EmailClassifyService) — 분류 결과가 이 룰의 입력값',
          'B-9 TCL 신규 메뉴 등록 — 이 메뉴 권한 설정 포함',
          'Teams Webhook — B-6/B-9 구현 후 backend/.env TEAMS_WEBHOOK_URL 설정 필요',
          'Spring TaskScheduler — 배정 룰 변경 시 폴링 서비스 즉시 반영',
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
