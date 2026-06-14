import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameControls from './GameControls.jsx'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gameApi.js')

const refresh = vi.fn()
const playing = { active: 1, winner: null }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  for (const fn of Object.values(gameApi)) if (vi.isMockFunction(fn)) fn.mockResolvedValue({})
})

describe('GameControls', () => {
  it('shows Next Question + Pause when active with no question', () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    expect(screen.getByRole('button', { name: 'Next Question' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Correct' })).not.toBeInTheDocument()
  })

  it('shows Correct/Incorrect when a question is showing', () => {
    render(<GameControls state={playing} question={{ id: 1, text: 'Q' }} refresh={refresh} />)
    expect(screen.getByRole('button', { name: 'Correct' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Incorrect' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()
  })

  it('reveals the next question and refreshes', async () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }))
    await waitFor(() => expect(gameApi.nextQuestion).toHaveBeenCalled())
    expect(refresh).toHaveBeenCalled()
  })

  it('submits a correct turn', async () => {
    render(<GameControls state={playing} question={{ id: 1 }} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Correct' }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(true))
  })

  it('shows Resume when paused', () => {
    render(<GameControls state={{ active: 2, winner: null }} question={null} refresh={refresh} />)
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('shows no play controls once there is a winner (only Mute)', () => {
    render(<GameControls state={{ active: 1, winner: 2 }} question={null} refresh={refresh} />)
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Correct' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument()
  })

  it('toggles mute and persists it', () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(localStorage.getItem('spacerace:muted')).toBe('true')
    expect(screen.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('surfaces an API error', async () => {
    gameApi.nextQuestion.mockRejectedValue(new Error('No more questions available'))
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no more questions/i)
  })
})
