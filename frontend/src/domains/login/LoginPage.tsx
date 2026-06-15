import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LOGIN_MESSAGES } from '../../shared/constants/messages';
import type { GlassConfig } from '@/stores/usePreferenceStore';
import { DEFAULT_GLASS } from '@/stores/usePreferenceStore';
import { hexToGlassGradient } from '@/lib/glassUtils';
import { korToEng } from '@/lib/korToEng';

interface LoginBulletin {
  id: number;
  title: string;
  content: string;
}

function getGlassFromStorage(): GlassConfig {
  try {
    const saved = localStorage.getItem('pm-glass');
    if (saved) return { ...DEFAULT_GLASS, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('환경설정 로드 실패:', e);
  }
  return DEFAULT_GLASS;
}

function hexToLoginGradient(hex: string): string {
  return hexToGlassGradient(hex, { topAlpha: 0.9, bottomAlpha: 1.0, darkOffset: 40, angle: 135 });
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
  const glassConfig = getGlassFromStorage();
  const loginGlass = glassConfig.login !== 'none';

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
        // 토큰은 서버가 HttpOnly 쿠키로 설정 — localStorage 저장 없음
        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        const meJson = await meRes.json();

        if (meRes.ok && meJson.success) {
          login(meJson.data);

          // 로그인 팝업 게시물 조회
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
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
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
              style={{ padding: '6px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    <div
      style={{
        minHeight: '100vh',
        background: loginGlass
          ? hexToLoginGradient(glassConfig.login)
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 95,
      }}
    >
      <div
        className={loginGlass ? 'glass-login-card' : ''}
        style={{
          minWidth: 480,
          background: loginGlass ? undefined : '#fff',
          borderRadius: loginGlass ? 16 : 6,
          border: loginGlass ? undefined : '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: 40,
        }}
      >
        {/* Logo Text */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0d4e85',
            marginTop: 60,
            marginBottom: 0,
            letterSpacing: '-0.5px',
          }}
        >
          PeakMate
        </h2>

        {/* Title */}
        <h1
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#64748b',
            marginTop: 6,
            marginBottom: 30,
          }}
        >
          {LOGIN_MESSAGES.login_header_title}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 320 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#64748b' }}>
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
                height: 40,
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ width: 320, marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#64748b' }}>
              {LOGIN_MESSAGES.password.label}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={LOGIN_MESSAGES.password.label}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {sessionExpiredMsg && (
            <div style={{ width: 320, padding: '8px 12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 13, textAlign: 'center', borderRadius: 4 }}>
              {sessionExpiredMsg}
            </div>
          )}

          {error && (
            <div style={{ width: 320, color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: 320,
              height: 40,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '로그인 중...' : LOGIN_MESSAGES.loginButton}
          </button>

          <button
            type="button"
            style={{
              width: 320,
              height: 40,
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {LOGIN_MESSAGES.registerButton}
          </button>

          <p style={{ color: '#94a3b8', fontSize: 13, whiteSpace: 'pre-line', textAlign: 'center', marginTop: 16 }}>
            {LOGIN_MESSAGES.login_warning_info}
          </p>

          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
            <a href="/privacy" target="_blank" rel="noopener noreferrer"
               style={{ color: '#64748b', textDecoration: 'underline', fontSize: 12 }}>
              개인정보처리방침
            </a>
          </p>

          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
            {LOGIN_MESSAGES.login_copy_right}
          </p>
        </form>
      </div>
    </div>
    </>
  );
}

export default LoginPage;
