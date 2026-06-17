import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from './Home.jsx'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gameApi.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Home title screen', () => {
  it('shows Play (to the Admin Panel) when no game is in progress', async () => {
    gameApi.getState.mockResolvedValue({ state: { active: 0, winner: null } })
    render(<Home />)
    const btn = await screen.findByRole('link', { name: 'Play' })
    expect(btn).toHaveAttribute('href', '/admin')
    expect(screen.queryByText(/in progress/i)).not.toBeInTheDocument()
  })

  it('shows Resume (still to the Admin Panel) when a game is active and unfinished', async () => {
    gameApi.getState.mockResolvedValue({ state: { active: 1, winner: null } })
    render(<Home />)
    const btn = await screen.findByRole('link', { name: 'Resume' })
    expect(btn).toHaveAttribute('href', '/admin')
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
  })

  it('shows Play when the active game is already finished (has a winner)', async () => {
    gameApi.getState.mockResolvedValue({ state: { active: 1, winner: 2 } })
    render(<Home />)
    expect(await screen.findByRole('link', { name: 'Play' })).toBeInTheDocument()
  })

  it('defaults to Play (no crash) when the server is unreachable', async () => {
    gameApi.getState.mockRejectedValue(new Error('offline'))
    render(<Home />)
    // The button renders immediately as Play; it must stay Play after the
    // rejected request settles.
    expect(screen.getByRole('link', { name: 'Play' })).toHaveAttribute('href', '/admin')
    await waitFor(() => expect(gameApi.getState).toHaveBeenCalled())
    expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument()
  })

  it('shows the game title', async () => {
    gameApi.getState.mockResolvedValue({ state: { active: 0, winner: null } })
    render(<Home />)
    expect(screen.getByRole('heading', { name: /space race/i })).toBeInTheDocument()
  })
})
