import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api';

export interface CommonCode {
  code: string;
  codeName: string;
}

/**
 * 공통코드 그룹에서 코드 목록을 조회하는 훅.
 * 여러 그룹을 한 번에 요청할 수 있음.
 */
export function useCommonCodes(...groups: string[]): Record<string, CommonCode[]> {
  const [data, setData] = useState<Record<string, CommonCode[]>>({});

  useEffect(() => {
    groups.forEach(group => {
      (async () => {
        try {
          const res = await authFetch(`/api/common-codes/group/${group}`);
          if (res.ok) {
            const json = await res.json();
            setData(prev => ({ ...prev, [group]: json.data || [] }));
          }
        } catch { /* 공통코드 조회 실패 — 빈 배열로 폴백 */ }
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.join(',')]);

  return data;
}

/**
 * 공통코드 셀렉트 라벨 스타일 (파란 * 표시)
 */
export const codeLabel = (label: string) => ({
  text: label,
  isCode: true,
});

/**
 * code → codeName 변환 헬퍼
 */
export function getCodeName(codes: CommonCode[] | undefined, code: string): string {
  if (!codes) return code;
  return codes.find(c => c.code === code)?.codeName || code;
}
