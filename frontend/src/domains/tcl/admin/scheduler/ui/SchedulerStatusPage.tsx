import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'AD0020';

export default function SchedulerStatusPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="Python APScheduler(스크래핑·임베딩 배치)와 Spring TaskScheduler(IMAP·알림·Teams)의 실행 이력·성공/실패·다음 실행 예정을 통합 모니터링하는 운영 대시보드"
        features={[
          'APScheduler 잡 목록 — 스크래핑·임베딩 배치 상태·마지막 실행·다음 예정',
          'Spring TaskScheduler 잡 목록 — IMAP 폴링·Teams 알림·세션 정리 현황',
          '잡별 실행 이력 (성공/실패/소요시간) 최근 30건',
          '실패 알림: 연속 3회 실패 시 Teams Webhook 자동 발송',
          'ShedLock 분산 락 현황 — 복수 서버 환경 중복 실행 방지 상태 표시',
        ]}
        devItems={[
          'APScheduler (Python) — 스크래핑·임베딩 배치 스케줄러',
          'Spring TaskScheduler (Java) — IMAP·알림·Teams 스케줄러',
          'ShedLock — 분산 환경 중복 실행 방지 (Spring 연동)',
          'Teams Webhook — 잡 실패 알림 자동 발송',
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
