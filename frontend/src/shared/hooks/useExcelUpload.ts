import { useCallback } from 'react';
import { authFetch } from '@/lib/api';
import { coreNotify } from '@/stores/useNotifyStore';

interface ParseResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

interface UseExcelUploadOptions<TParsed> {
  parseFn: (buffer: ArrayBuffer) => ParseResult<TParsed>;
  batchUrl: string;
  existingData: Record<string, unknown>[];
  matchKey: (parsed: TParsed) => string | number;
  existingMatchKey: (row: Record<string, unknown>) => string | number;
  fetchData: () => void;
}

/**
 * 엑셀 업로드 → 파싱 → 키 매칭 Upsert → 배치 API 자동화 훅.
 * 업로드 전 confirm은 호출자 책임 (useConfirm 훅으로 처리).
 */
export function useExcelUpload<TParsed extends Record<string, unknown>>(
  options: UseExcelUploadOptions<TParsed>,
) {
  const { parseFn, batchUrl, existingData, matchKey, existingMatchKey, fetchData } = options;

  const handleExcelUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const result = parseFn(buffer);

      if (result.errors.length > 0) {
        coreNotify(`업로드가 중단되었습니다.\n\n${result.errors.join('\n')}`, { type: 'error' });
        return;
      }

      if (result.warnings.length > 0) {
        coreNotify(result.warnings.join('\n'), { type: 'warning' });
        if (result.data.length === 0) return;
      }

      const existingByKey = new Map<string | number, Record<string, unknown>>();
      const deactivatePayload: Record<string, unknown>[] = [];
      for (const row of existingData) {
        if (row.id) {
          existingByKey.set(existingMatchKey(row), row);
          if (row.isActive !== 'N') {
            deactivatePayload.push({ ...row, _rowState: 'updated', isActive: 'N' });
          }
        }
      }

      const upsertPayload: Record<string, unknown>[] = [];
      const matchedIds = new Set<unknown>();

      for (const parsed of result.data) {
        const key = matchKey(parsed);
        const existing = existingByKey.get(key);
        if (existing) {
          upsertPayload.push({ ...parsed, _rowState: 'updated', id: existing.id, isActive: 'Y' });
          matchedIds.add(existing.id);
        } else {
          upsertPayload.push({ ...parsed, _rowState: 'created', isActive: 'Y' });
        }
      }

      if (upsertPayload.length === 0 && deactivatePayload.length === 0) {
        coreNotify('변경할 데이터가 없습니다.', { type: 'info' });
        return;
      }

      const finalDeactivate = deactivatePayload.filter(r => !matchedIds.has(r.id));

      const res = await authFetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...finalDeactivate, ...upsertPayload]),
      });

      if (!res.ok) {
        coreNotify('엑셀 업로드 중 오류가 발생했습니다.', { type: 'error' });
        return;
      }

      coreNotify('엑셀 업로드가 완료되었습니다.', { type: 'success' });
      fetchData();
    };
    input.click();
  }, [parseFn, batchUrl, existingData, matchKey, existingMatchKey, fetchData]);

  return handleExcelUpload;
}
