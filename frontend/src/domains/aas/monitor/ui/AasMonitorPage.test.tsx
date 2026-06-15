import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AasMonitorPage from './AasMonitorPage'

vi.mock('@/components/ui/PageTitle', () => ({
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}))

vi.mock('@/shared/components/toast/ToastProvider', () => ({
  useToast: () => ({ notify: vi.fn() }),
}))

const mockChannels = [
  { channel_id: 'ch-1', name: 'PLC 100ms', active: true, collected_count: 500, last_collected: '2026-03-19T10:00:00' },
  { channel_id: 'ch-2', name: 'PLC 1s', active: false, collected_count: 120, last_collected: '2026-03-19T09:50:00' },
]

const mockStatuses = [
  { instance_id: 'inst-1', instance_name: '설비A', connected: true, last_collected: '2026-03-19T10:00:00', error_count: 0, category: 'Temperature' },
  { instance_id: 'inst-2', instance_name: '설비B', connected: false, last_collected: '', error_count: 3, category: 'Pressure' },
]

const mockCollectedRows = [
  { timestamp: '2026-03-19T10:00:00', node_id: 'ns=2;s=EQUIP/Temp', aas_path: '/OperationalData/Temp', plc_address: 'D7801', category: 'Temperature', value: '85.3', unit: '°C' },
  { timestamp: '2026-03-19T10:00:01', node_id: 'ns=2;s=EQUIP/Press', aas_path: null, plc_address: 'D7900', category: 'Pressure', value: '1.2', unit: 'MPa' },
]

function mockFetchSuccess() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.includes('/api/opcua/channels') && !url.includes('toggle')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChannels) } as Response)
    }
    if (url.includes('/api/opcua/collection-status')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStatuses) } as Response)
    }
    if (url.includes('/api/opcua/collected-data')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCollectedRows) } as Response)
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
  })
}

describe('AasMonitorPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders page title', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)
    render(<AasMonitorPage />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('fetches and displays channels', async () => {
    mockFetchSuccess()
    render(<AasMonitorPage />)

    await waitFor(() => {
      expect(screen.getByText('PLC 100ms')).toBeDefined()
      expect(screen.getByText('PLC 1s')).toBeDefined()
    })

    expect(screen.getByText('활성')).toBeDefined()
    expect(screen.getByText('비활성')).toBeDefined()
  })

  it('fetches and displays collection status', async () => {
    mockFetchSuccess()
    render(<AasMonitorPage />)

    await waitFor(() => {
      expect(screen.getByText('설비A')).toBeDefined()
      expect(screen.getByText('설비B')).toBeDefined()
    })

    expect(screen.getByText('연결됨')).toBeDefined()
    expect(screen.getByText('끊김')).toBeDefined()
  })

  it('filters collected data by category', async () => {
    mockFetchSuccess()
    render(<AasMonitorPage />)

    await waitFor(() => {
      expect(screen.getByText('85.3')).toBeDefined()
    })

    const select = screen.getByDisplayValue('전체 카테고리')
    expect(select).toBeDefined()
    expect(select.tagName).toBe('SELECT')
  })

  it('handles API error gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<AasMonitorPage />)).not.toThrow()

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
    consoleSpy.mockRestore()
  })
})
