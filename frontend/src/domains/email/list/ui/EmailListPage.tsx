import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColDef } from 'ag-grid-community';
import { PeakDataGrid } from '@/components/grid/PeakDataGrid';
import { PageTitle } from '@/components/ui/PageTitle';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { authFetch } from '@/lib/api';
import { useCommonCodes } from '@/hooks/useCommonCodes';

interface EmailMessage {
  id: number;
  subject: string;
  senderEmail: string;
  senderName: string;
  receivedAt: string;
  processingStatus: string;
  classificationPurpose: string | null;
  classificationConfidence: number | null;
  classificationSummary: string | null;
  customerName: string | null;
  partnerName: string | null;
  sizeBytes: number | null;
  aiProcessedAt: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  CLASSIFIED: '#3b82f6',
  UNASSIGNED: '#8b5cf6',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

export default function EmailListPage() {
  const { t } = useTranslation();
  const perm = usePermission('EM0010');
  const { notify } = useToast();
  const allCodes = useCommonCodes('EMAIL_PURPOSE');

  const [statusFilter, setStatusFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [importing, setImporting] = useState(false);
  const [classifying, setClassifying] = useState(false);

  const purposeCodes = allCodes['EMAIL_PURPOSE'] ?? [];

  const extraParams = useMemo(() => ({
    processingStatus: statusFilter || undefined,
    classificationPurpose: purposeFilter || undefined,
    keyword: keyword || undefined,
  }), [statusFilter, purposeFilter, keyword]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const res = await authFetch('/api/email/import', { method: 'POST' });
      const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      if (res.ok) {
        const msg = json?.data?.message || json?.message || '이메일 가져오기 완료';
        notify(msg, { type: 'success' });
        setRefetchTrigger(n => n + 1);
      } else {
        notify(json?.error?.message || json?.message || '이메일 가져오기에 실패했습니다', { type: 'error' });
      }
    } catch {
      notify('이메일 가져오기 중 오류가 발생했습니다', { type: 'error' });
    } finally {
      setImporting(false);
    }
  }, [notify]);

  const handleClassify = useCallback(async () => {
    setClassifying(true);
    try {
      const res = await authFetch('/api/email/classify', { method: 'POST' });
      const json = await res.json().catch(() => ({ message: '서버 응답을 처리할 수 없습니다' }));
      if (res.ok) {
        const msg = json?.data?.message || json?.message || 'AI 분류 완료';
        notify(msg, { type: 'success' });
        setRefetchTrigger(n => n + 1);
      } else {
        notify(json?.error?.message || json?.message || 'AI 분류에 실패했습니다', { type: 'error' });
      }
    } catch {
      notify('AI 분류 중 오류가 발생했습니다', { type: 'error' });
    } finally {
      setClassifying(false);
    }
  }, [notify]);

  const columns: ColDef<EmailMessage>[] = useMemo(() => [
    {
      field: 'receivedAt',
      headerName: '수신일시',
      width: 160,
      cellRenderer: (p: { value: string | null }) => p.value ? p.value.substring(0, 19).replace('T', ' ') : '',
    },
    { field: 'subject', headerName: '제목', flex: 1, minWidth: 200 },
    { field: 'senderName', headerName: '발신자', width: 140 },
    { field: 'senderEmail', headerName: '발신자 이메일', width: 200 },
    {
      field: 'classificationPurpose',
      headerName: '분류',
      width: 100,
      cellStyle: { textAlign: 'center' },
      cellRenderer: (p: { value: string | null }) => {
        const codeName = purposeCodes.find(c => c.code === p.value)?.codeName ?? p.value ?? '-';
        return <span title={p.value ?? ''}>{codeName}</span>;
      },
    },
    {
      field: 'classificationConfidence',
      headerName: '신뢰도',
      width: 80,
      cellStyle: { textAlign: 'right' },
      cellRenderer: (p: { value: number | null }) =>
        p.value != null ? `${(Number(p.value) * 100).toFixed(0)}%` : '-',
    },
    {
      field: 'classificationSummary',
      headerName: 'AI 요약',
      flex: 1,
      minWidth: 160,
      cellRenderer: (p: { value: string | null }) =>
        p.value ? <span title={p.value}>{p.value}</span> : '-',
    },
    {
      field: 'processingStatus',
      headerName: '상태',
      width: 100,
      cellStyle: { textAlign: 'center' },
      cellRenderer: (p: { value: string }) => {
        const color = STATUS_COLOR[p.value] ?? '#6b7280';
        return (
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 12,
            background: `${color}20`, color, fontWeight: 500,
          }}>
            {p.value}
          </span>
        );
      },
    },
    { field: 'customerName', headerName: '고객사', width: 140 },
    { field: 'partnerName', headerName: '협력사', width: 140 },
    {
      field: 'sizeBytes',
      headerName: '크기',
      width: 80,
      cellStyle: { textAlign: 'right' },
      cellRenderer: (p: { value: number | null }) =>
        p.value != null ? `${Math.round(p.value / 1024)}KB` : '-',
    },
  ], [purposeCodes]);

  if (perm.loading) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PeakDataGrid<EmailMessage>
        hideRowNumber
        toolbarLeft={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <PageTitle title={t('menu.EM0010', '이메일목록')} menuCode="EM0010" />
            {/* statusFilter: 시스템 내부 처리상태 enum — Rule 8-5 공통코드 전환 제외 */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
            >
              <option value="">전체 상태</option>
              <option value="PENDING">PENDING</option>
              <option value="CLASSIFIED">CLASSIFIED</option>
              <option value="UNASSIGNED">UNASSIGNED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            {/* purposeFilter: 공통코드 EMAIL_PURPOSE 사용 (Rule 8-5) */}
            <select
              value={purposeFilter}
              onChange={e => setPurposeFilter(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
            >
              <option value="">전체 분류</option>
              {purposeCodes.map(c => (
                <option key={c.code} value={c.code}>{c.codeName}({c.code})</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="제목/발신자 검색"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setRefetchTrigger(n => n + 1)}
              style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: 160 }}
            />
            {perm.canCreate && (
              <>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="mes-btn"
                >
                  {importing ? '가져오는 중...' : '이메일 가져오기'}
                </button>
                <button
                  onClick={handleClassify}
                  disabled={classifying}
                  className="mes-btn"
                >
                  {classifying ? '분류 중...' : 'AI 분류'}
                </button>
              </>
            )}
          </div>
        }
        columns={columns}
        queryKey={['email-messages']}
        queryUrl="/email/messages"
        extraParams={extraParams}
        refetchTrigger={refetchTrigger}
        permission={{ canExport: perm.canExport }}
        pageSize={50}
      />
    </div>
  );
}
