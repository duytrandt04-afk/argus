import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Pillars } from '../Pillars'

describe('Pillars', () => {
  it('renders the three pillars', () => {
    render(<Pillars />)
    expect(screen.getByText('Hook management')).toBeInTheDocument()
    expect(screen.getByText('Hook simulator')).toBeInTheDocument()
    expect(screen.getByText('Script collection')).toBeInTheDocument()
  })

  it('links the script collection to GitHub', () => {
    render(<Pillars />)
    const link = screen.getByRole('link', { name: /browse the scripts/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/duytrandt04-afk/argus/tree/main/my-custom-hook-scripts'
    )
  })
})
