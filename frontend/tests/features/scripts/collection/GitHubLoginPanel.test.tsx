import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GitHubLoginPanel } from '@/features/scripts/collection/GitHubLoginPanel'
import { DeviceFlowModal } from '@/features/scripts/collection/DeviceFlowModal'

describe('GitHubLoginPanel', () => {
  it('fires onLogin', () => {
    const onLogin = vi.fn()
    render(<GitHubLoginPanel onLogin={onLogin} busy={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Login with GitHub' }))
    expect(onLogin).toHaveBeenCalled()
  })
})

describe('DeviceFlowModal', () => {
  it('renders the user code when a device is present', () => {
    render(
      <DeviceFlowModal
        device={{
          user_code: 'WDJB-MJHT',
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 5,
        }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('WDJB-MJHT')).toBeInTheDocument()
  })

  it('renders nothing when device is null', () => {
    const { container } = render(<DeviceFlowModal device={null} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
