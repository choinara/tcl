import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'EM0010';

export default function EmailDashboardPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="IMAP으로 수신된 이메일의 AI 분류 현황·자동응답 통계·미처리 건수를 실시간으로 모니터링하는 운영 대시보드"
        features={[
          '분류 카테고리별(운임문의/부킹/선적서류/트랙킹/통관/기타) 수신 현황 도넛 차트',
          '자동응답률·평균 처리시간 KPI 카드',
          '미처리 이메일 건수 알림 및 담당자별 현황',
          '최근 24시간 수신 이메일 타임라인',
          'WebSocket 실시간 갱신 (신규 이메일 즉시 반영)',
        ]}
        devItems={[
          'B-6 IMAP 폴링 (EmailImportService) — 수신 데이터 공급원',
          'B-7 AI 분류 (EmailClassifyService) — 카테고리 집계 기반',
          'WebSocket 실시간 알림 연동',
          'pgvector email_embeddings — 유사 이메일 통계',
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
