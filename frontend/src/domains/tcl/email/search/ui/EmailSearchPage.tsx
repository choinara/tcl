import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';

const MENU_CODE = 'EM0020';

export default function EmailSearchPage() {
  const perm = usePermission(MENU_CODE);
  if (!perm.canRead) return null;

  return (
    <div className="page-container">
      <PageTitle menuCode={MENU_CODE} />
      <PlaceholderInfo
        purpose="IMAP으로 수신된 전체 이메일을 AI 분류 카테고리·기간·발신자·키워드로 검색하고, pgvector RAG 기반 유사 이메일을 함께 조회하는 통합 이메일 검색 화면"
        features={[
          '카테고리 필터: FREIGHT_INQUIRY / BOOKING / BL_DOCS / TRACKING / CUSTOMS / OTHER',
          '기간·발신자·제목·본문 키워드 복합 검색',
          'pgvector 코사인 유사도 기반 유사 이메일 추천 (RAG)',
          '이메일 상세 보기: AI 분류 근거·자동회신 이력·담당자 배정 상태',
          '첨부파일 다운로드 및 Excel 내보내기',
        ]}
        devItems={[
          'B-6 IMAP 폴링 (EmailImportService) — 수신 이메일 저장 공급원',
          'B-7 AI 분류 (EmailClassifyService) — 카테고리 필터 기반',
          'pgvector email_embeddings — 유사 이메일 검색 벡터 인덱스',
          'OpenAI text-embedding-3-small — 쿼리 임베딩 생성',
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
