import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <h1 style={{ fontSize: 72, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#334155', margin: '8px 0 4px' }}>
        페이지를 찾을 수 없습니다
      </h2>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <button
        onClick={() => navigate('/')}
        aria-label="메인 페이지로 이동"
        style={{
          padding: '8px 24px',
          fontSize: 14,
          color: '#fff',
          backgroundColor: '#2563eb',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}
