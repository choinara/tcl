import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'EM0030';

export default function ImapAccountPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle />
      <PlaceholderInfo
        purpose="이메일 자동화의 수신 창구인 IMAP 계정을 등록·관리하고, 폴링 주기 및 연결 상태를 모니터링하는 설정 화면 (복수 계정 지원)"
        features={[
          'IMAP 서버 등록: 호스트·포트·계정·비밀번호·SSL 여부 설정',
          '연결 테스트 버튼 — 저장 전 실시간 접속 검증',
          '폴링 주기 설정 (기본 5분, 최소 1분)',
          '계정별 수신 폴더 지정 (INBOX 외 커스텀 폴더)',
          '마지막 수신 시각·누적 수신 건수·오류 로그 현황 표시',
        ]}
        devItems={[
          'B-6 IMAP 폴링 (EmailImportService) — 이 화면에서 등록한 계정을 소비',
          'B-8 backend/.env 실값 채우기 — IMAP_HOST / IMAP_PORT / IMAP_USERNAME / IMAP_PASSWORD',
          'Spring TaskScheduler — 폴링 주기 동적 변경 연동',
          'Teams Webhook 알림 — 수신 오류 발생 시 즉시 알림',
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
