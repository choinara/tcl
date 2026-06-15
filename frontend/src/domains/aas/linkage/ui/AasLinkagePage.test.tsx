import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import AasLinkagePage from './AasLinkagePage'

// ─── Mocks ───
vi.mock('@/components/ui/PageTitle', () => ({
  PageTitle: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <h1>{children ?? title}</h1>
  ),
}))

vi.mock('@/shared/components/toast/ToastProvider', () => ({
  useToast: () => ({ notify: vi.fn() }),
}))

// ─── Test Data ───
const mockDataPoints = [
  {
    node_id: 'ns=2;s=Temperature.Sensor1',
    browse_name: 'Sensor1',
    korean_name: '온도센서1',
    category: 'Temperature',
    plc_address: 'D100',
    data_type: 'Float',
    sampling_ms: 1000,
    unit: '\u00b0C',
    aas_linked: true,
    aas_path: '/OperationalData/Temperature:Sensor1',
    element_id: 1,
  },
  {
    node_id: 'ns=2;s=Pressure.Gauge1',
    browse_name: 'Gauge1',
    korean_name: '\uc555\ub825\uac8c\uc774\uc9c01',
    category: 'Pressure',
    plc_address: 'D200',
    data_type: 'Float',
    sampling_ms: 500,
    unit: 'bar',
    aas_linked: false,
    aas_path: null,
    element_id: null,
  },
]

const mockApiResponse = {
  data_points: mockDataPoints,
  stats: { Temperature: 1, Pressure: 1 },
  total_linked: 1,
  total_points: 2,
}

// ─── Helpers ───
function mockFetchSuccess(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response)
}

function mockFetchError() {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
}

// ─── Tests ───
describe('AasLinkagePage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockFetchSuccess(mockApiResponse)
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('renders page title', async () => {
    render(<AasLinkagePage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('fetches and displays linkage data', async () => {
    render(<AasLinkagePage />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/aas/linkage')
    })

    // Wait for data to load - stats section should show total count "2"
    await waitFor(() => {
      expect(screen.getByText('전체').previousElementSibling).toHaveTextContent('2')
    })

    // Connection rate label should be present
    expect(screen.getByText('연결률')).toBeInTheDocument()

    // Category stats should show Temperature and Pressure (multiple matches due to tree + table + stats)
    expect(screen.getAllByText('Temperature').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Pressure').length).toBeGreaterThanOrEqual(1)

    // Verify data point names appear in the table
    await waitFor(() => {
      expect(screen.getByText('Sensor1')).toBeInTheDocument()
      expect(screen.getByText('Gauge1')).toBeInTheDocument()
    })
  })

  it('shows category filter', async () => {
    render(<AasLinkagePage />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
    })

    // Category filter select should contain the default and category options
    const categorySelect = screen.getByDisplayValue('전체 카테고리')
    expect(categorySelect).toBeInTheDocument()

    // Verify category options exist
    const options = categorySelect.querySelectorAll('option')
    const optionTexts = Array.from(options).map(o => o.textContent)
    expect(optionTexts).toContain('전체 카테고리')
    expect(optionTexts.some(t => t?.includes('Temperature'))).toBe(true)
    expect(optionTexts.some(t => t?.includes('Pressure'))).toBe(true)
    expect(optionTexts.some(t => t?.includes('Vision'))).toBe(true)
  })

  it('handles empty data', async () => {
    fetchSpy.mockRestore()
    fetchSpy = mockFetchSuccess({
      data_points: [],
      stats: {},
      total_linked: 0,
      total_points: 0,
    })

    render(<AasLinkagePage />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/aas/linkage')
    })

    // Stats should show 0
    await waitFor(() => {
      expect(screen.getByText('0건')).toBeInTheDocument()
    })

    // Table body should have no data rows
    const table = screen.getByRole('table')
    const tbody = table.querySelector('tbody')
    expect(tbody?.querySelectorAll('tr')).toHaveLength(0)
  })

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchSpy.mockRestore()
    fetchSpy = mockFetchError()

    render(<AasLinkagePage />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/aas/linkage')
    })

    // Component should still render without crashing
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    // Should show 0 items since data failed to load
    await waitFor(() => {
      expect(screen.getByText('0건')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})
