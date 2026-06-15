import type { ApiResponse } from '@/components/grid/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoadingStore } from '@/stores/useLoadingStore';

const BASE_URL = '/api';

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // HttpOnly 쿠키(refresh_token)가 자동 전송됨
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (!data?.user) return false;
        useAuthStore.getState().onTokenRefreshed(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 응답 헤더에 X-Token-Expiring이 있으면 백그라운드로 토큰 갱신
 * (만료 5분 전 서버가 헤더를 추가)
 */
function checkTokenExpiring(res: Response) {
  if (res.headers.get('X-Token-Expiring') === 'true') {
    tryRefreshToken().catch(() => {}); // 백그라운드 갱신 — 실패 시 다음 API 호출에서 재시도
  }
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

async function request<T>(url: string, options?: RequestInit & { silent?: boolean }): Promise<ApiResponse<T>> {
  if (!options?.silent) useLoadingStore.getState().start();
  try {
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options?.headers }, credentials: 'include' });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await fetch(url, { ...options, headers: { ...getHeaders(), ...options?.headers }, credentials: 'include' });
      if (!retryRes.ok) throw new Error('요청 처리에 실패했습니다.');
      return retryRes.json();
    }
    await useAuthStore.getState().logout();
    window.location.href = '/login?sessionExpired=true';
    throw new Error('Unauthorized');
  }

  // 토큰 만료 임박 시 백그라운드 갱신
  checkTokenExpiring(res);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: '요청 처리에 실패했습니다.' }));
    throw new Error(errorBody.message || '요청 처리에 실패했습니다.');
  }
  return res.json();
  } finally {
    if (!options?.silent) useLoadingStore.getState().stop();
  }
}

class ApiClient {
  async get<T>(url: string, params?: Record<string, string | number | undefined>, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const fullUrl = `${BASE_URL}${url}${queryString ? `?${queryString}` : ''}`;

    return request<T>(fullUrl, { silent: options?.silent });
  }

  async post<T>(url: string, body?: unknown, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    return request<T>(`${BASE_URL}${url}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      silent: options?.silent,
    });
  }

  async put<T>(url: string, body: unknown, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    return request<T>(`${BASE_URL}${url}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      silent: options?.silent,
    });
  }

  async delete<T>(url: string, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    return request<T>(`${BASE_URL}${url}`, {
      method: 'DELETE',
      silent: options?.silent,
    });
  }
}

export const api = new ApiClient();

/**
 * 사용자 활동 기반 토큰 갱신.
 * - 마우스/키보드/스크롤 등 실제 활동이 감지되면 마지막 활동 시각 갱신
 * - 15분마다 체크: 최근 활동이 있었으면 토큰 갱신, 없으면 스킵
 * - 3시간 완전 무활동 시 Refresh Token 만료 → 자동 로그아웃
 */
let tokenRefreshTimer: ReturnType<typeof setInterval> | null = null;
let lastActivity = Date.now();
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

function onUserActivity() {
  lastActivity = Date.now();
}

export function startTokenRefreshTimer() {
  stopTokenRefreshTimer();
  lastActivity = Date.now();

  // 활동 이벤트 감지
  ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onUserActivity, { passive: true }));

  // 15분마다 체크: 최근 25분 이내 활동이 있었으면 갱신
  tokenRefreshTimer = setInterval(() => {
    const idleMs = Date.now() - lastActivity;
    // 25분 이내 활동이 있었을 때만 갱신 (30분 만료 - 5분 여유)
    if (idleMs < 25 * 60 * 1000) {
      tryRefreshToken().catch(() => {}); // 15분 주기 갱신 — 실패 시 다음 주기에서 재시도
    }
  }, 15 * 60 * 1000); // 15분
}

export function stopTokenRefreshTimer() {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
  ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onUserActivity));
}

/**
 * HttpOnly 쿠키 기반 fetch 래퍼.
 * 쿠키가 자동 전송되므로 Authorization 헤더 불필요.
 * 401 시 토큰 갱신 후 재시도, 실패 시 로그아웃 처리.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => { headers[k] = v; });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => { headers[k] = v; });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  const res = await fetch(input, { ...init, headers, credentials: 'include' });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return fetch(input, { ...init, headers, credentials: 'include' });
    }
    await useAuthStore.getState().logout();
    window.location.href = '/login?sessionExpired=true';
  }

  // 토큰 만료 임박 시 백그라운드 갱신
  checkTokenExpiring(res);

  return res;
}
