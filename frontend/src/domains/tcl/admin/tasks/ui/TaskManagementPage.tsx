import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'AD0010';

export default function TaskManagementPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle />
      <PlaceholderInfo
        purpose="TCL 51개 AI 개발 과제의 진행 상태·담당자·마일스톤을 추적하고, 그룹(A/B/C/D)별 완료율과 의존 관계를 시각화하는 프로젝트 관리 화면"
        features={[
          '51개 개발 과제 목록 — 그룹·상태·담당자·예정일 필터',
          '그룹별 완료율 진행 바 (A: 이메일자동화 / B: 인프라 / C: 스크래핑 / D: RAG챗봇)',
          '과제 상세: 요구사항·연관 메뉴코드·의존 과제·완료 기준 기록',
          '마일스톤 타임라인 — 납품 목표일 대비 진행률',
          '과제 상태 변경 이력 및 코멘트 스레드',
        ]}
        devItems={[
          'B-9 TCL 신규 메뉴 등록 — 이 과제 관리 메뉴 포함',
          'AD0020 스케줄러 현황 — 과제별 배치 작업 연계 모니터링',
          'Spring WebSocket — 과제 상태 변경 실시간 알림',
          'Teams Webhook — 과제 완료·지연 알림',
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
