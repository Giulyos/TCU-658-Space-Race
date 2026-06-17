import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuestionDisplay from './QuestionDisplay.jsx'
import * as gameApi from '../api/gameApi.js'

vi.mock('../api/gameApi.js')
vi.mock('../sound/sounds.js')

const refresh = vi.fn()
const state = (over = {}) => ({
  active: 1,
  winner: null,
  currentTeam: 2,
  teamNames: ['Red', 'Blue', 'Green', 'Gold'],
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  gameApi.submitTurn.mockResolvedValue({})
})

describe('QuestionDisplay header', () => {
  it('shows whose turn it is and the point value (not the word "Question")', () => {
    render(<QuestionDisplay question={{ id: 1, text: 'Q?', point_value: 2 }} state={state()} refresh={refresh} />)
    expect(screen.getByText(/Blue/)).toBeInTheDocument()
    expect(screen.getByText(/2 points/)).toBeInTheDocument()
    expect(screen.queryByText(/^Question$/)).not.toBeInTheDocument()
  })

  it('uses the singular "point" for a 1-point question', () => {
    render(<QuestionDisplay question={{ id: 1, text: 'Q?', point_value: 1 }} state={state()} refresh={refresh} />)
    expect(screen.getByText(/1 point(?!s)/)).toBeInTheDocument()
  })

  it('marks the turn correct/incorrect', async () => {
    render(<QuestionDisplay question={{ id: 1, text: 'Q?', point_value: 1 }} state={state()} refresh={refresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Correct' }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(true))
    fireEvent.click(screen.getByRole('button', { name: 'Incorrect' }))
    await waitFor(() => expect(gameApi.submitTurn).toHaveBeenCalledWith(false))
  })

  it('renders nothing when not in active play', () => {
    const { container } = render(
      <QuestionDisplay question={{ id: 1, text: 'Q?', point_value: 1 }} state={state({ active: 2 })} refresh={refresh} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
