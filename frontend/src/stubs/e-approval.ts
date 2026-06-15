/**
 * e-approval 모듈 stub.
 * peakmate-Util/e-approval 미사용 — to-be에서 전자결재 재구현 예정.
 */
import { createElement, type ReactNode } from 'react';

export function ApprovalProvider({ children }: { apiBaseUrl: string; fetchFn: unknown; children: ReactNode }) {
  return createElement('div', null, children);
}

export function ApprovalRoutes() {
  return createElement('div', null, '전자결재 모듈 준비 중입니다.');
}
