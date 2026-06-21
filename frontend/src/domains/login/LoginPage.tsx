import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LOGIN_MESSAGES } from '../../shared/constants/messages';
import { korToEng } from '@/lib/korToEng';
import tclLogo from '/tcl-logo.png';

interface LoginBulletin {
  id: number;
  title: string;
  content: string;
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const composingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const [bulletins, setBulletins] = useState<LoginBulletin[]>([]);
  const [bulletinIndex, setBulletinIndex] = useState(0);
  const [pendingNavigate, setPendingNavigate] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (searchParams.get('sessionExpired') === 'true') {
      setSessionExpiredMsg('세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError(LOGIN_MESSAGES.username.required);
      return;
    }
    if (!password) {
      setError(LOGIN_MESSAGES.password.required);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));

      if (!res.ok) {
        if (res.status === 401) setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        else if (res.status >= 500) setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        else setError(json?.message || '요청을 처리할 수 없습니다.');
        return;
      }

      if (json?.success) {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meJson = await meRes.json();

        if (meRes.ok && meJson.success) {
          login(meJson.data);

          try {
            const bulletinRes = await fetch('/api/system/bulletins/login-popup', { credentials: 'include' });
            const bulletinJson = await bulletinRes.json();
            const items: LoginBulletin[] = bulletinJson?.data || [];
            const dismissed = JSON.parse(localStorage.getItem('pm-dismissed-bulletins') || '[]');
            const filtered = items.filter(b => !dismissed.includes(b.id));
            if (filtered.length > 0) {
              setBulletins(filtered);
              setBulletinIndex(0);
              setPendingNavigate(true);
              return;
            }
          } catch (e) {
            console.warn('공지사항 조회 실패:', e);
          }

          navigate('/');
          return;
        }
        setError('사용자 정보 조회에 실패했습니다.');
      } else {
        setError(json?.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('[LOGIN] error:', err);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulletinClose = useCallback(() => {
    if (bulletinIndex < bulletins.length - 1) {
      setBulletinIndex(prev => prev + 1);
    } else {
      setBulletins([]);
      setPendingNavigate(false);
      navigate('/');
    }
  }, [bulletinIndex, bulletins.length, navigate]);

  const handleBulletinDismiss = useCallback((id: number) => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('pm-dismissed-bulletins') || '[]');
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('pm-dismissed-bulletins', JSON.stringify(dismissed));
      }
    } catch (e) {
      console.warn('공지사항 닫기 설정 저장 실패:', e);
    }
    handleBulletinClose();
  }, [handleBulletinClose]);

  const currentBulletin = bulletins[bulletinIndex];

  return (
    <>
      {/* 로그인 팝업 게시물 */}
      {pendingNavigate && currentBulletin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8, width: 500, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{currentBulletin.title}</h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {bulletinIndex + 1} / {bulletins.length}
              </span>
            </div>
            <div style={{ padding: 20, flex: 1, overflow: 'auto', fontSize: 14, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>
              {currentBulletin.content}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => handleBulletinDismiss(currentBulletin.id)}
                style={{ padding: '6px 14px', background: 'none', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                다시 보지 않기
              </button>
              <button onClick={handleBulletinClose}
                style={{ padding: '6px 18px', background: '#307dd4', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 레이아웃 */}
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

        {/* 레이어 1: TCL 홈페이지 캡처 배경 이미지 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(1px)',
          transform: 'scale(1.02)',
        }} />

        {/* 레이어 2: 다크 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(0,20,55,0.42) 0%, rgba(0,10,30,0.38) 100%)',
        }} />

        {/* 레이어 3: 로그인 카드 */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: 440,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 14,
          padding: '48px 48px 40px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12)',
        }}>

          {/* TCL 로고 */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <img
              src={tclLogo}
              alt="True Companion Logistics"
              style={{ height: 52, objectFit: 'contain' }}
            />
          </div>

          {/* 서브타이틀 */}
          <p style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
            marginTop: 8,
            marginBottom: 32,
            letterSpacing: '0.02em',
          }}>
            {LOGIN_MESSAGES.login_header_title}
          </p>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                {LOGIN_MESSAGES.username.label}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  if (composingRef.current) {
                    setUsername(e.target.value);
                  } else {
                    setUsername(korToEng(e.target.value));
                  }
                }}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={(e) => {
                  composingRef.current = false;
                  const target = e.target as HTMLInputElement;
                  setUsername(korToEng(target.value));
                }}
                placeholder={LOGIN_MESSAGES.username.label}
                autoFocus
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#307dd4')}
                onBlur={e => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                {LOGIN_MESSAGES.password.label}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={LOGIN_MESSAGES.password.label}
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#307dd4')}
                onBlur={e => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            {sessionExpiredMsg && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 13, textAlign: 'center', borderRadius: 6 }}>
                {sessionExpiredMsg}
              </div>
            )}

            {error && (
              <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 44,
                background: loading ? '#93c5fd' : '#307dd4',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'background 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#1a6abf'); }}
              onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#307dd4'); }}
            >
              {loading ? '로그인 중...' : LOGIN_MESSAGES.loginButton}
            </button>

            <button
              type="button"
              style={{
                width: '100%',
                height: 44,
                background: '#fff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {LOGIN_MESSAGES.registerButton}
            </button>

            <p style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'pre-line', textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>
              {LOGIN_MESSAGES.login_warning_info}
            </p>

            <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 0 }}>
              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                 style={{ color: '#64748b', textDecoration: 'underline', fontSize: 12 }}>
                개인정보처리방침
              </a>
            </p>

            <p style={{ color: '#b0bec5', fontSize: 11, textAlign: 'center', marginTop: 0 }}>
              {LOGIN_MESSAGES.login_copy_right}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
