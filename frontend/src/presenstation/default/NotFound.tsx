import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, color: '#e5e7eb', margin: '0 0 8px' }}>404</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Page not found</p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '8px 24px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Home
      </button>
    </div>
  );
}

export default NotFound;
