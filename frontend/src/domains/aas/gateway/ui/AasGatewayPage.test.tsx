import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import AasGatewayPage from './AasGatewayPage'

vi.mock('@/components/ui/PageTitle', () => ({
  PageTitle: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <h1>{children ?? title}</h1>
  ),
}))

vi.mock('@/shared/components/toast/ToastProvider', () => ({
  useToast: () => ({ notify: vi.fn() }),
}))

vi.mock('../../shared/constants', () => ({
  OPCUA_CATEGORIES: ['CNC', 'PLC', 'ROBOT'],
}))

const mockStatus = {
  endpoint: 'opc.tcp://localhost:4840',
  namespace_uri: 'urn:peakmate:opcua',
  security_policy: 'Basic256Sha256',
  status: 'RUNNING',
  uptime: '3d 12h 5m',
  total_sessions: 5,
  total_subscriptions: 12,
  total_monitored_items: 340,
  cpu_usage: 23.5,
  memory_mb: 512,
}

const mockLogs = [
  { id: 1, timestamp: '2026-03-19 10:00:00', level: 'INFO', source: 'SessionManager', message: 'New session created' },
  { id: 2, timestamp: '2026-03-19 10:01:00', level: 'WARN', source: 'NodeMonitor', message: 'Read timeout' },
  { id: 3, timestamp: '2026-03-19 10:02:00', level: 'ERROR', source: 'Connection', message: 'Connection lost' },
]

function createFetchMock(overrides?: Partial<Record<string, unknown>>) {
  const defaults: Record<string, unknown> = {
    '/api/opcua/gateway/status': mockStatus,
    '/api/opcua/gateway/sessions': [],
    '/api/opcua/gateway/equip-nodes': [],
    '/api/opcua/gateway/logs': mockLogs,
    ...overrides,
  }

  return vi.fn((url: string) => {
    const data = defaults[url]
    if (data !== undefined) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  }) as Mock
}

describe('AasGatewayPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders page title', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(createFetchMock())
    render(<AasGatewayPage />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('fetches and displays server status', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(createFetchMock())
    render(<AasGatewayPage />)

    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument()
    })

    expect(screen.getByText('opc.tcp://localhost:4840')).toBeInTheDocument()
    expect(screen.getByText('3d 12h 5m')).toBeInTheDocument()
    expect(screen.getByText('RAM: 512 MB')).toBeInTheDocument()
  })

  it('fetches and displays logs', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(createFetchMock())
    render(<AasGatewayPage />)

    await waitFor(() => {
      expect(screen.getByText('New session created')).toBeInTheDocument()
    })

    expect(screen.getByText('Read timeout')).toBeInTheDocument()
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
  })

  it('filters logs by level', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(createFetchMock())
    render(<AasGatewayPage />)

    await waitFor(() => {
      expect(screen.getByText('New session created')).toBeInTheDocument()
    })

    // Click ERROR filter button (aria-label set by ARIA enhancement)
    const errorBtn = screen.getByRole('button', { name: /로그 레벨 필터: ERROR/ })
    fireEvent.click(errorBtn)

    // ERROR log should remain visible
    expect(screen.getByText('Connection lost')).toBeInTheDocument()

    // INFO and WARN logs should be filtered out
    expect(screen.queryByText('New session created')).not.toBeInTheDocument()
    expect(screen.queryByText('Read timeout')).not.toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('Network error')))

    render(<AasGatewayPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('게이트웨이 데이터 로드 실패:', expect.any(Error))
    })

    // Page should still render without crashing
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
    // Loading/empty states should be shown
    expect(screen.getByText('서버 정보 로딩 중...')).toBeInTheDocument()
  })
})
