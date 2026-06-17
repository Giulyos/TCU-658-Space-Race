import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameLibrary from './GameLibrary.jsx'
import * as api from '../api/gamesApi.js'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gamesApi.js')
vi.mock('../api/gameApi.js')

const GAMES = [
  { id: 1, name: 'Unit 3 Review', team_names: ['Red', 'Blue'] },
  { id: 2, name: 'Vocabulary', team_names: ['A', 'B', 'C', 'D'] },
]

beforeEach(() => {
  vi.clearAllMocks()
  api.getGames.mockResolvedValue(GAMES)
  api.getGameQuestions.mockImplementation(async (id) =>
    id === 1 ? [{}, {}, {}] : [{}], // 3 questions for game 1, 1 for game 2
  )
  api.deleteGame.mockResolvedValue(null)
  // No game in progress by default.
  gameApi.getState.mockResolvedValue({ state: { active: 0, winner: null }, activeGameId: null })
})

describe('GameLibrary', () => {
  it('lists saved games with team and question counts', async () => {
    render(<GameLibrary onPlay={vi.fn()} onEdit={vi.fn()} onNew={vi.fn()} />)
    expect(await screen.findByText('Unit 3 Review')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('2 teams · 3 questions')).toBeInTheDocument())
    expect(screen.getByText('4 teams · 1 questions')).toBeInTheDocument()
  })

  it('shows an empty state when there are no games', async () => {
    api.getGames.mockResolvedValue([])
    render(<GameLibrary onPlay={vi.fn()} onEdit={vi.fn()} onNew={vi.fn()} />)
    expect(await screen.findByText(/no games yet/i)).toBeInTheDocument()
  })

  it('fires onNew, onPlay, and onEdit', async () => {
    const onNew = vi.fn()
    const onPlay = vi.fn()
    const onEdit = vi.fn()
    render(<GameLibrary onPlay={onPlay} onEdit={onEdit} onNew={onNew} />)
    await screen.findByText('Unit 3 Review')

    fireEvent.click(screen.getByRole('button', { name: '+ New Game' }))
    expect(onNew).toHaveBeenCalled()

    fireEvent.click(screen.getAllByRole('button', { name: 'Play' })[0])
    expect(onPlay).toHaveBeenCalledWith(GAMES[0], { resume: false })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Unit 3 Review' }))
    expect(onEdit).toHaveBeenCalledWith(GAMES[0])
  })

  it('shows Resume + Restart for the in-progress game (and Play for the rest)', async () => {
    // Game 1 is the loaded, started, unfinished session.
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: null },
      activeGameId: 1,
    })
    const onPlay = vi.fn()
    render(<GameLibrary onPlay={onPlay} onEdit={vi.fn()} onNew={vi.fn()} />)
    await screen.findByText('Unit 3 Review')

    // Game 1 -> Resume + Restart; Game 2 -> Play.
    const resume = await screen.findByRole('button', { name: 'Resume' })
    expect(screen.getByRole('button', { name: 'Restart Unit 3 Review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()

    // Resume continues the save; Restart starts it fresh.
    fireEvent.click(resume)
    expect(onPlay).toHaveBeenCalledWith(GAMES[0], { resume: true })

    fireEvent.click(screen.getByRole('button', { name: 'Restart Unit 3 Review' }))
    expect(onPlay).toHaveBeenCalledWith(GAMES[0], { resume: false })
  })

  it('marks the in-progress game row (badge + is-current) and leaves others unmarked', async () => {
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: null },
      activeGameId: 1,
    })
    const { container } = render(<GameLibrary onPlay={vi.fn()} onEdit={vi.fn()} onNew={vi.fn()} />)
    await screen.findByText('Unit 3 Review')

    await waitFor(() => expect(screen.getByText('In progress')).toBeInTheDocument())
    const current = container.querySelectorAll('.game-row.is-current')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Unit 3 Review')
    // only the in-progress game is badged
    expect(screen.getAllByText('In progress')).toHaveLength(1)
  })

  it('shows "Play" for a finished game even if it is the active one', async () => {
    gameApi.getState.mockResolvedValue({
      state: { active: 1, winner: 2 }, // has a winner -> not resumable
      activeGameId: 1,
    })
    render(<GameLibrary onPlay={vi.fn()} onEdit={vi.fn()} onNew={vi.fn()} />)
    await screen.findByText('Unit 3 Review')
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Play' })).toHaveLength(2),
    )
    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeInTheDocument()
  })

  it('requires confirmation before deleting', async () => {
    render(<GameLibrary onPlay={vi.fn()} onEdit={vi.fn()} onNew={vi.fn()} />)
    await screen.findByText('Unit 3 Review')

    // First click reveals a confirm button; it does not delete yet.
    fireEvent.click(screen.getByRole('button', { name: 'Delete Unit 3 Review' }))
    expect(api.deleteGame).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete Unit 3 Review' }))
    await waitFor(() => expect(api.deleteGame).toHaveBeenCalledWith(1))
  })
})
