import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'TK0010';

export default function TrackingPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="컨테이너 번호 또는 B/L 번호로 선적 현황을 조회하고, ETA D-Day 카운트다운·통관 진행 상태·이벤트 타임라인을 실시간으로 모니터링하는 화면"
        features={[
          '컨테이너/B/L 번호 입력 → 선사 트랙킹 스크래핑 즉시 조회',
          'ETA D-Day 카운트다운 배지 — 입항 임박 건 강조',
          '선적 이벤트 타임라인: 출항·환적·입항·통관·반출 단계별 표시',
          '통관 현황 연계: 관세청 UNI-PASS 스크래핑 (CUSTOMS 카테고리)',
          'WebSocket 실시간 갱신 — 이벤트 발생 즉시 화면 반영',
        ]}
        devItems={[
          'Python Playwright 스크래핑 — 선사 트랙킹 페이지·관세청 UNI-PASS',
          'APScheduler (Python) — 진행 중 건 주기적 상태 업데이트',
          'B-7 AI 분류 — TRACKING·CUSTOMS 이메일과 트랙킹 데이터 연계',
          'Spring WebSocket — ETA 변경·통관 완료 이벤트 실시간 Push',
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
