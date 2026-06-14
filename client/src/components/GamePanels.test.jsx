import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TurnIndicator from './TurnIndicator.jsx'
import QuestionDisplay from './QuestionDisplay.jsx'
import Scoreboard from './Scoreboard.jsx'

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
  const q = { id: 5, text: 'Past tense of go?', correct_answer: 'went', distractors: ['goed', 'gone'] }

  it('shows the question text', () => {
    render(<QuestionDisplay question={q} />)
    expect(screen.getByText('Past tense of go?')).toBeInTheDocument()
  })

  it('shows all options (correct + distractors) when distractors exist', () => {
    render(<QuestionDisplay question={q} />)
    for (const opt of ['went', 'goed', 'gone']) {
      expect(screen.getByText(new RegExp(opt))).toBeInTheDocument()
    }
  })

  it('omits the options list when there are no distractors', () => {
    render(<QuestionDisplay question={{ id: 1, text: 'Open?', correct_answer: 'x', distractors: [] }} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('orders options stably across re-renders of the same question', () => {
    const order = () =>
      screen.getAllByRole('listitem').map((li) => li.textContent.replace(/^[A-Z]\s*/, ''))
    const { unmount } = render(<QuestionDisplay question={q} />)
    const first = order()
    expect([...first].sort()).toEqual(['gone', 'goed', 'went'].sort()) // same set
    unmount()
    render(<QuestionDisplay question={q} />)
    expect(order()).toEqual(first) // deterministic for the same id (unmutated)
  })

  it('renders nothing without a question', () => {
    const { container } = render(<QuestionDisplay question={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Scoreboard', () => {
  it('ranks teams by position, highest first', () => {
    render(<Scoreboard state={state()} />)
    const names = screen.getAllByText(/Red|Blue|Green|Gold/).map((el) => el.textContent)
    expect(names[0]).toBe('Blue') // 7 — leader
    expect(names[1]).toBe('Red') // 3
  })

  it('shows each team position out of the finish line', () => {
    render(<Scoreboard state={state()} />)
    expect(screen.getByText('7/10')).toBeInTheDocument()
    expect(screen.getByText('0/10')).toBeInTheDocument()
  })

  it('renders nothing before a game starts', () => {
    const { container } = render(<Scoreboard state={state({ active: 0 })} />)
    expect(container).toBeEmptyDOMElement()
  })
})
