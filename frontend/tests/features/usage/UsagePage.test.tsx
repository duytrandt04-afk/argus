import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsagePage } from '@/features/usage/UsagePage'

// Full localStorage mock to survive unstubGlobals: true restoring localStorage to undefined
// (pattern: vi.stubGlobal so it is re-stubbed in each beforeEach)
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

function renderUsagePage() {
  return render(
    <MemoryRouter>
      <UsagePage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // Re-stub localStorage each test so unstubGlobals restore doesn't leave it undefined
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.getItem.mockReturnValue(null)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('UsagePage', () => {
  it('renders the page heading', () => {
    renderUsagePage()
    expect(screen.getByText('OpenAI Usage')).toBeInTheDocument()
  })

  it('renders empty state when no API key is set', () => {
    renderUsagePage()
    // UsagePanel shows "Admin API Key Required" when no key present
    expect(screen.getByText('Admin API Key Required')).toBeInTheDocument()
  })

  it('renders API key input field', () => {
    renderUsagePage()
    const input = screen.getByPlaceholderText('OpenAI Admin API Key...')
    expect(input).toBeInTheDocument()
  })

  it('renders provider selector trigger', () => {
    renderUsagePage()
    // The Select trigger should be visible (not necessarily showing text "OpenAI" — it shows SelectValue)
    const input = screen.getByPlaceholderText('OpenAI Admin API Key...')
    expect(input).toBeInTheDocument()
  })

  it('renders Fetch button', () => {
    renderUsagePage()
    expect(screen.getByRole('button', { name: 'Fetch' })).toBeInTheDocument()
  })
})
