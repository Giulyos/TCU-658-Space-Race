import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameControls from './GameControls.jsx'
import * as gameApi from '../api/gameApi.js'
import * as nav from '../lib/nav.js'

vi.mock('../api/gameApi.js')
vi.mock('../lib/nav.js')

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

  it('does not show Correct/Incorrect in the bar (they live on the popup)', () => {
    render(<GameControls state={playing} question={{ id: 1, text: 'Q' }} refresh={refresh} />)
    expect(screen.queryByRole('button', { name: 'Correct', exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Incorrect' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()
  })

  it('reveals the next question and refreshes', async () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }))
    await waitFor(() => expect(gameApi.nextQuestion).toHaveBeenCalled())
    expect(refresh).toHaveBeenCalled()
  })

  it('grays out (no popup) and shows Resume when paused', () => {
    const { container } = render(
      <GameControls state={{ active: 2, winner: null }} question={null} refresh={refresh} />,
    )
    expect(container.querySelector('.pause-grayout')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    // no centered popup/dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('shows no controls once there is a winner', () => {
    render(<GameControls state={{ active: 1, winner: 2 }} question={null} refresh={refresh} />)
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Correct' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument()
  })

  it('shows Mute only alongside Next Question (not during a question)', () => {
    const withQuestion = render(<GameControls state={playing} question={{ id: 1 }} refresh={refresh} />)
    expect(withQuestion.queryByRole('button', { name: 'Mute' })).not.toBeInTheDocument()
    withQuestion.unmount()

    render(<GameControls state={playing} question={null} refresh={refresh} />)
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument()
  })

  it('toggles mute and persists it', () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(localStorage.getItem('spacerace:muted')).toBe('true')
    expect(screen.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a Home button next to Pause that navigates to the Admin Panel', () => {
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    const home = screen.getByRole('button', { name: 'Home' })
    expect(home).toBeInTheDocument()
    fireEvent.click(home)
    expect(nav.navigateTo).toHaveBeenCalledWith('/admin')
  })

  it('keeps Home available while paused (alongside Resume)', () => {
    render(<GameControls state={{ active: 2, winner: null }} question={null} refresh={refresh} />)
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(nav.navigateTo).toHaveBeenCalledWith('/admin')
  })

  it('hides Home while a question is showing', () => {
    render(<GameControls state={playing} question={{ id: 1, text: 'Q' }} refresh={refresh} />)
    expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('surfaces an API error', async () => {
    gameApi.nextQuestion.mockRejectedValue(new Error('No more questions available'))
    render(<GameControls state={playing} question={null} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no more questions/i)
  })
})
