import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TurnIndicator from './TurnIndicator.jsx'
import QuestionDisplay from './QuestionDisplay.jsx'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gameApi.js')

const state = (over = {}) => ({
  active: 1,
  currentTeam: 2,
  positions: [3, 7, 1, 0],
  finishLine: 10,
  teamNames: ['Red', 'Blue', 'Green', 'Gold'],
  winner: null,
  ...over,
})

describe('TurnIndicator', () => {
  it('names the current team', () => {
    render(<TurnIndicator state={state()} />)
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText(/’s turn/)).toBeInTheDocument()
  })

  it('shows a paused notice when paused', () => {
    render(<TurnIndicator state={state({ active: 2 })} />)
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
  })

  it('renders nothing before start or after a winner', () => {
    const { container, rerender } = render(<TurnIndicator state={state({ active: 0 })} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<TurnIndicator state={state({ winner: 1 })} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('QuestionDisplay', () => {
  const q = { id: 5, text: 'Past tense of go?', correct_answer: 'went' }
  const playing = { active: 1, winner: null }
  const refresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    for (const fn of Object.values(gameApi)) if (vi.isMockFunction(fn)) fn.mockResolvedValue({})
  })

  it('shows the question text as a dialog during active play', () => {
    render(<QuestionDisplay question={q} state={playing} refresh={refresh} />)
    expect(screen.getByRole('dialog', { name: /current question/i })).toBeInTheDocument()
    expect(screen.getByText('Past tense of go?')).toBeInTheDocument()
  })

  it('does not reveal the correct answer or any answer options', () => {
    render(<QuestionDisplay question={q} state={playing} refresh={refresh} />)
    expect(screen.queryByText('went')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('has Correct/Incorrect on the popup and marks the turn', async () => {
    render(<QuestionDisplay question={q} state={playing} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Correct', exact: true }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(true))
    expect(refresh).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Incorrect' }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(false))
  })

  it('is hidden without a question (buttons gone too)', () => {
    const { container } = render(<QuestionDisplay question={null} state={playing} refresh={refresh} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is hidden when paused or after a winner', () => {
    const paused = render(<QuestionDisplay question={q} state={{ active: 2, winner: null }} refresh={refresh} />)
    expect(paused.container).toBeEmptyDOMElement()
    const won = render(<QuestionDisplay question={q} state={{ active: 1, winner: 2 }} refresh={refresh} />)
    expect(won.container).toBeEmptyDOMElement()
  })
})
