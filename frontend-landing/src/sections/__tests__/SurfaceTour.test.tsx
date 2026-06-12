import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SurfaceTour } from '../SurfaceTour'

describe('SurfaceTour', () => {
  it('renders six surface rows, hooks first', () => {
    render(<SurfaceTour />)
    const titles = screen.getAllByRole('heading', { level: 3 })
    expect(titles).toHaveLength(6)
    expect(titles[0]).toHaveTextContent(/hooks/i)
  })
})
