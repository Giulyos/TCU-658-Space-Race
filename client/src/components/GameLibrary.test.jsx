import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameLibrary from './GameLibrary.jsx'
import * as api from '../api/gamesApi.js'

vi.mock('../api/gamesApi.js')

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
    expect(onPlay).toHaveBeenCalledWith(GAMES[0])

    fireEvent.click(screen.getByRole('button', { name: 'Edit Unit 3 Review' }))
    expect(onEdit).toHaveBeenCalledWith(GAMES[0])
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
