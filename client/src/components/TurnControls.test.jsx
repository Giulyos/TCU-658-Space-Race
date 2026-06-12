import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TurnControls from './TurnControls.jsx'
import * as gameApi from '../api/gameApi.js'
import { useGameState } from '../hooks/useGameState.js'

vi.mock('../api/gameApi.js')
vi.mock('../hooks/useGameState.js', () => ({ useGameState: vi.fn() }))

const refresh = vi.fn()

// Sets the mocked game state for a test.
const mockState = (state) => {
  useGameState.mockReturnValue({ state, question: null, loading: false, error: null, refresh })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  for (const fn of Object.values(gameApi)) if (vi.isMockFunction(fn)) fn.mockResolvedValue({ state: {} })
})

describe('TurnControls', () => {
  it('enables only Start (and Mute) before a game starts', () => {
    mockState({ active: 0, winner: null })
    render(<TurnControls />)
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Correct' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Incorrect' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled()
  })

  it('enables turn controls during an active game', () => {
    mockState({ active: 1, winner: null })
    render(<TurnControls />)
    expect(screen.getByRole('button', { name: 'Correct' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
  })

  it('submits a correct turn and refreshes', async () => {
    mockState({ active: 1, winner: null })
    render(<TurnControls />)
    fireEvent.click(screen.getByRole('button', { name: 'Correct' }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(true))
    expect(refresh).toHaveBeenCalled()
  })

  it('shows Resume (not Pause) when the game is paused', () => {
    mockState({ active: 2, winner: null })
    render(<TurnControls />)
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('disables turn controls once there is a winner', () => {
    mockState({ active: 1, winner: 2 })
    render(<TurnControls />)
    expect(screen.getByRole('button', { name: 'Correct' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
  })

  it('toggles mute and persists it to localStorage', () => {
    mockState({ active: 0, winner: null })
    render(<TurnControls />)
    const btn = screen.getByRole('button', { name: 'Mute' })
    fireEvent.click(btn)
    expect(localStorage.getItem('spacerace:muted')).toBe('true')
    expect(screen.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('surfaces an API error', async () => {
    mockState({ active: 0, winner: null })
    gameApi.startGame.mockRejectedValue(new Error('Cannot start a game with an empty question bank'))
    render(<TurnControls />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/empty question bank/i)
  })
})
