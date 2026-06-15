import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  menuCode?: string;
  pathToMenuCode?: Record<string, string>;
}

export function ProtectedRoute({ menuCode, pathToMenuCode }: ProtectedRouteProps) {
  const { user, initialized, permissionMap, menus } = useAuthStore();
  const location = useLocation();

  // 초기화 전이면 로딩 표시
  if (!initialized) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        인증 확인 중...
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 이동
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // menuCode 결정: 명시적 prop 우선, 없으면 path 매핑에서 자동 조회
  const resolvedMenuCode = menuCode || pathToMenuCode?.[location.pathname];

  // menuCode가 있고 메뉴 데이터가 로드된 경우 canRead 권한 체크
  if (resolvedMenuCode && menus.length > 0) {
    const perm = permissionMap[resolvedMenuCode];
    if (!perm || !perm.canRead) {
      return (
        <div role="alert" style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>접근 권한 없음</h2>
          <p style={{ color: '#6b7280' }}>이 페이지에 접근할 권한이 없습니다.</p>
        </div>
      );
    }
  }

  return <Outlet />;
}
