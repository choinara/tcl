import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AasConnectionPage from './AasConnectionPage';

// ─── Mocks ───
vi.mock('@/components/ui/PageTitle', () => ({
  PageTitle: ({ label }: { label?: string }) => <h2>{label}</h2>,
}));

vi.mock('@/shared/components/toast/ToastProvider', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

// ─── Helpers ───
const mockDataSources = [
  {
    source_id: 'DS-001',
    source_name: '데이터소스 1',
    source_type: 'plc',
    plc_ip: '192.168.1.1',
    plc_port: 502,
    status: 'ACTIVE',
  },
];

function createFetchResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);
}

// ─── Tests ───
describe('AasConnectionPage', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock;
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('/api/opcua/data-sources')) {
        return createFetchResponse(mockDataSources);
      }
      if (url.includes('/api/opcua/collection-items')) {
        return createFetchResponse([]);
      }
      if (url.includes('/api/opcua/nodes')) {
        return createFetchResponse([]);
      }
      return createFetchResponse({}, false);
    });
  });

  it('renders page title', () => {
    render(<AasConnectionPage />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders step indicator with all step labels', () => {
    render(<AasConnectionPage />);
    expect(screen.getByText(/데이터소스 연결/)).toBeInTheDocument();
    expect(screen.getByText(/매핑 설정/)).toBeInTheDocument();
    expect(screen.getByText(/OPC-UA 노드/)).toBeInTheDocument();
  });

  it('fetches data sources on mount and renders table', async () => {
    render(<AasConnectionPage />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/opcua/data-sources'),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('DS-001')).toBeInTheDocument();
      expect(screen.getByText('데이터소스 1')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockRejectedValue(new Error('Network error'));

    render(<AasConnectionPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '데이터소스 로드 실패:',
        expect.any(Error),
      );
    });

    // Page should still render without crashing
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows step 1 by default with active styling', () => {
    render(<AasConnectionPage />);

    const step1Button = screen.getByText(/데이터소스 연결/).closest('button')!;
    expect(step1Button).not.toBeDisabled();

    // Step 1 content should be visible (e.g. the data source type heading)
    expect(screen.getByText('데이터소스 유형')).toBeInTheDocument();
  });
});
