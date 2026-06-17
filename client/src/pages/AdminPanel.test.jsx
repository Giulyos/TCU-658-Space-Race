import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel.jsx'
import * as gamesApi from '../api/gamesApi.js'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gamesApi.js')
vi.mock('../api/gameApi.js')

const GAME = { id: 1, name: 'Unit 3 Review', team_names: ['Red', 'Blue'] }

beforeEach(() => {
  vi.clearAllMocks()
  gamesApi.getGames.mockResolvedValue([GAME])
  gamesApi.getGameQuestions.mockResolvedValue([])
  gamesApi.activateGame.mockResolvedValue({ state: { active: 0 } })
  // GameLibrary reads game state to decide Play vs Resume; default: none active.
  gameApi.getState.mockResolvedValue({ state: { active: 0, winner: null }, activeGameId: null })
})

describe('AdminPanel view router', () => {
  it('shows the game library by default', async () => {
    render(<AdminPanel />)
    expect(await screen.findByText('Unit 3 Review')).toBeInTheDocument()
    expect(screen.getByText('My Games')).toBeInTheDocument()
  })

  it('activates + starts a game and switches to the play view on Play', async () => {
    const gameApi = await import('../api/gameApi.js')
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await waitFor(() => expect(gamesApi.activateGame).toHaveBeenCalledWith(1))
    expect(gameApi.startGame).toHaveBeenCalled()
    expect(await screen.findByText('Now playing: Unit 3 Review')).toBeInTheDocument()
  })

  it('resumes an in-progress game without resetting it (no activate/start)', async () => {
    // The game is the loaded, started, unfinished session -> shows "Resume".
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: null },
      activeGameId: 1,
    })
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(await screen.findByRole('button', { name: 'Resume' }))
    expect(await screen.findByText('Now playing: Unit 3 Review')).toBeInTheDocument()
    // Resume must NOT restart the match.
    expect(gamesApi.activateGame).not.toHaveBeenCalled()
    expect(gameApi.startGame).not.toHaveBeenCalled()
  })

  it('opens the wizard on New Game and returns to the library on Cancel', async () => {
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: '+ New Game' }))
    expect(await screen.findByText(/step 1 of 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('My Games')).toBeInTheDocument()
  })
})
