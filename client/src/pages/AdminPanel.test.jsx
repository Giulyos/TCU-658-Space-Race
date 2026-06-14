import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel.jsx'
import * as gamesApi from '../api/gamesApi.js'

vi.mock('../api/gamesApi.js')
vi.mock('../api/gameApi.js')

const GAME = { id: 1, name: 'Unit 3 Review', team_names: ['Red', 'Blue'] }

beforeEach(() => {
  vi.clearAllMocks()
  gamesApi.getGames.mockResolvedValue([GAME])
  gamesApi.getGameQuestions.mockResolvedValue([])
  gamesApi.activateGame.mockResolvedValue({ state: { active: 0 } })
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

  it('opens the wizard on New Game and returns to the library on Cancel', async () => {
    render(<AdminPanel />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: '+ New Game' }))
    expect(await screen.findByText(/step 1 of 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('My Games')).toBeInTheDocument()
  })
})
