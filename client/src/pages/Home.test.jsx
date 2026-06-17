import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home.jsx'

describe('Home title screen', () => {
  it('always shows a Play button leading to the Admin Panel', () => {
    render(<Home />)
    const btn = screen.getByRole('link', { name: 'Play' })
    expect(btn).toHaveAttribute('href', '/admin')
    // The title screen never auto-routes to the board.
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('shows the game title', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
  })
})
