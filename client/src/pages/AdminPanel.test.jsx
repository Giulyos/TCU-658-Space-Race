import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel.jsx'
import * as gamesApi from '../api/gamesApi.js'
import * as gameApi from '../api/gameApi.js'
import * as nav from '../lib/nav.js'

vi.mock('../api/gamesApi.js')
vi.mock('../api/gameApi.js')
vi.mock('../lib/nav.js')

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

  it('has a Menu button that returns to the start screen', () => {
    render(<AdminPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(nav.navigateTo).toHaveBeenCalledWith('/')
  })

  it('activates + starts a game on Play, then navigates to the board', async () => {
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await waitFor(() => expect(gamesApi.activateGame).toHaveBeenCalledWith(1))
    expect(gameApi.startGame).toHaveBeenCalled()
    await waitFor(() => expect(nav.navigateTo).toHaveBeenCalledWith('/game'))
  })

  it('resumes an in-progress game without resetting it, going straight to the board', async () => {
    // The game is the loaded, started, unfinished session -> shows "Resume".
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: null },
      activeGameId: 1,
    })
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(await screen.findByRole('button', { name: 'Resume' }))
    await waitFor(() => expect(nav.navigateTo).toHaveBeenCalledWith('/game'))
    // Resume must NOT restart the match.
    expect(gamesApi.activateGame).not.toHaveBeenCalled()
    expect(gameApi.startGame).not.toHaveBeenCalled()
  })

  it('restarts an in-progress game (fresh activate + start), then navigates to the board', async () => {
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: null },
      activeGameId: 1,
    })
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(await screen.findByRole('button', { name: 'Restart Unit 3 Review' }))
    await waitFor(() => expect(gamesApi.activateGame).toHaveBeenCalledWith(1))
    expect(gameApi.startGame).toHaveBeenCalled()
    await waitFor(() => expect(nav.navigateTo).toHaveBeenCalledWith('/game'))
  })

  it('opens the wizard on New Game and returns to the library on Cancel', async () => {
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: '+ New Game' }))
    expect(await screen.findByText(/step 1 of 3/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('My Games')).toBeInTheDocument()
  })
})
