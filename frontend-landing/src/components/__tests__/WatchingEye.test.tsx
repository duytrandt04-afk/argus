import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WatchingEye } from '../WatchingEye'

describe('WatchingEye', () => {
  it('renders the eye mark', () => {
    const { container } = render(<WatchingEye />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelectorAll('circle').length).toBeGreaterThanOrEqual(2)
  })

  it('survives cursor movement', () => {
    render(<WatchingEye />)
    fireEvent.mouseMove(window, { clientX: 200, clientY: 100 })
    // no assertion beyond not throwing — tracking is rAF-driven and
    // disabled under jsdom's default reduced-motion/hover media queries
  })
})
