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
  it('starts on step 1 with the game & rules fields (team names are step 2)', () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('New Game')).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Game name')).toBeInTheDocument()
    expect(screen.getByLabelText('Number of teams')).toBeInTheDocument()
    // team-name inputs only appear on step 2
    expect(screen.queryByLabelText('Team 1 name')).not.toBeInTheDocument()
  })

  it('requires a game name before advancing past step 1', async () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Team names' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/name is required/i)
    expect(gamesApi.createGame).not.toHaveBeenCalled()
  })

  it('step 2 collects team names; persistence happens on the way to step 3', async () => {
    render(<GameWizard game={null} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Unit 3' } })
    fireEvent.change(screen.getByLabelText('Number of teams'), { target: { value: '2' } })

    // step 1 -> step 2 (no persistence yet)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Team names' }))
    expect(await screen.findByText(/step 2 of 3/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Team 1 name')).toBeInTheDocument()
    expect(screen.getByLabelText('Team 2 name')).toBeInTheDocument()
    expect(gamesApi.createGame).not.toHaveBeenCalled()

    // step 2 -> step 3 persists, then loads the new game's bank
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))
    await waitFor(() =>
      expect(gamesApi.createGame).toHaveBeenCalledWith({
        name: 'Unit 3',
        finishLine: 10,
        teamNames: ['Team 1', 'Team 2'],
      }),
    )
    expect(await screen.findByText(/step 3 of 3/i)).toBeInTheDocument()
    await waitFor(() => expect(gamesApi.getGameQuestions).toHaveBeenCalledWith(7))
  })
})

describe('GameWizard — edit flow', () => {
  const game = { id: 3, name: 'Vocabulary', finish_line: 8, team_names: ['Red', 'Blue', 'Green'] }

  it('pre-fills step 1 (rules) and step 2 (team names) from the existing game', () => {
    render(<GameWizard game={game} onDone={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Edit: Vocabulary')).toBeInTheDocument()
    expect(screen.getByLabelText('Game name')).toHaveValue('Vocabulary')
    expect(screen.getByLabelText(/spaces to win/i)).toHaveValue(8)

    // team names live on step 2, pre-filled
    fireEvent.click(screen.getByRole('button', { name: 'Next: Team names' }))
    expect(screen.getByLabelText('Team 3 name')).toHaveValue('Green')
  })

  it('updates (not creates) on the way to step 3 and scopes the bank to the game', async () => {
    render(<GameWizard game={game} onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Vocab v2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next: Team names' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))

    await waitFor(() =>
      expect(gamesApi.updateGame).toHaveBeenCalledWith(3, expect.objectContaining({ name: 'Vocab v2' })),
    )
    expect(gamesApi.createGame).not.toHaveBeenCalled()
    await waitFor(() => expect(gamesApi.getGameQuestions).toHaveBeenCalledWith(3))
  })

  it('calls onDone from step 3', async () => {
    const onDone = vi.fn()
    render(<GameWizard game={game} onDone={onDone} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next: Team names' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Questions' }))
    const done = await screen.findByRole('button', { name: 'Done' })
    fireEvent.click(done)
    expect(onDone).toHaveBeenCalled()
  })
})
