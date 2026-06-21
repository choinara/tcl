import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'CB0010';

export default function ChatbotPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="pgvector RAG로 과거 이메일·운임·스케줄 데이터를 검색하고 Claude API로 회신 초안을 생성하는 물류 업무 전용 AI 챗봇 인터페이스"
        features={[
          '자연어 질의 → pgvector 유사 이메일·운임 검색 → 컨텍스트 주입',
          'Claude API 스트리밍 응답 — 타이핑 애니메이션 실시간 표시',
          '회신 초안 생성: 수신 이메일 선택 후 "회신 초안 작성" 버튼',
          '참조 문서 출처 표시 — RAG 검색 근거 이메일·문서 링크',
          '대화 이력 저장 및 북마크 기능',
        ]}
        devItems={[
          'pgvector email_embeddings — RAG 검색 벡터 인덱스 (1536차원 HNSW)',
          'OpenAI text-embedding-3-small — 쿼리 임베딩 생성',
          'Claude API (Anthropic SDK) — 회신 초안·질의 응답 생성',
          'backend/.env ANTHROPIC_API_KEY — 고객사 제공 예정 (현재 미입력)',
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
