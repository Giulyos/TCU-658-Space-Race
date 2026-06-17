import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home.jsx'

describe('Home launcher', () => {
  it('offers a Teacher (Admin) and a Projector (Game) entry', () => {
    render(<Home />)
    const admin = screen.getByRole('link', { name: /teacher/i })
    const game = screen.getByRole('link', { name: /projector/i })
    expect(admin).toHaveAttribute('href', '/admin')
    expect(game).toHaveAttribute('href', '/game')
  })

  it('shows the game title', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
  })
})
