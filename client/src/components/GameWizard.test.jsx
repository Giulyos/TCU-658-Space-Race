import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameWizard from './GameWizard.jsx'
import * as gamesApi from '../api/gamesApi.js'

vi.mock('../api/gamesApi.js')

beforeEach(() => {
  vi.clearAllMocks()
  gamesApi.createGame.mockResolvedValue({ id: 7, name: 'New One' })
  gamesApi.updateGame.mockResolvedValue({ id: 3 })
  // QuestionBank (Step 2) scoped calls:
  gamesApi.getGameQuestions.mockResolvedValue([])
  gamesApi.addGameQuestion.mockResolvedValue({ id: 1 })
})

describe('GameWizard — create flow', () => {
  it('starts on step 1 with default team fields', () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('New Game')).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Team 1 name')).toBeInTheDocument()
  })

  it('requires a game name before advancing', async () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/name is required/i)
    expect(gamesApi.createGame).not.toHaveBeenCalled()
  })

  it('creates the game on Next and advances to the question bank', async () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Unit 3' } })
    fireEvent.change(screen.getByLabelText('Number of teams'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))

    await waitFor(() =>
      expect(gamesApi.createGame).toHaveBeenCalledWith({
        name: 'Unit 3',
        finishLine: 10,
        teamNames: ['Team 1', 'Team 2'],
      }),
    )
    expect(await screen.findByText(/step 2 of 2/i)).toBeInTheDocument()
    // Step 2 loads the new game's (empty) bank
    await waitFor(() => expect(gamesApi.getGameQuestions).toHaveBeenCalledWith(7))
  })
})

describe('GameWizard — edit flow', () => {
  const game = { id: 3, name: 'Vocabulary', finish_line: 8, team_names: ['Red', 'Blue', 'Green'] }

  it('pre-fills step 1 from the existing game', () => {
    render(<GameWizard game={game} onDone={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Edit: Vocabulary')).toBeInTheDocument()
    expect(screen.getByLabelText('Game name')).toHaveValue('Vocabulary')
    expect(screen.getByLabelText(/spaces to win/i)).toHaveValue(8)
    expect(screen.getByLabelText('Team 3 name')).toHaveValue('Green')
  })

  it('updates (not creates) on Next and scopes step 2 to the game', async () => {
    render(<GameWizard game={game} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Vocab v2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))

    await waitFor(() =>
      expect(gamesApi.updateGame).toHaveBeenCalledWith(3, expect.objectContaining({ name: 'Vocab v2' })),
    )
    expect(gamesApi.createGame).not.toHaveBeenCalled()
    await waitFor(() => expect(gamesApi.getGameQuestions).toHaveBeenCalledWith(3))
  })

  it('calls onDone from step 2', async () => {
    const onDone = vi.fn()
    render(<GameWizard game={game} onDone={onDone} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))
    const done = await screen.findByRole('button', { name: 'Done' })
    fireEvent.click(done)
    expect(onDone).toHaveBeenCalled()
  })
})
