import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RaceTrack from './RaceTrack.jsx'
import { positionPercent } from './raceUtils.js'

const state = (over = {}) => ({
  active: 1,
  currentTeam: 1,
  positions: [0, 5, 10, 2],
  finishLine: 10,
  teamNames: ['Red', 'Blue', 'Green', 'Gold'],
  winner: null,
  ...over,
})

describe('positionPercent', () => {
  it('maps position to a clamped 0-100% of the finish line', () => {
    expect(positionPercent(0, 10)).toBe(0)
    expect(positionPercent(5, 10)).toBe(50)
    expect(positionPercent(10, 10)).toBe(100)
    expect(positionPercent(13, 10)).toBe(100) // overshoot clamps
    expect(positionPercent(3, 0)).toBe(0) // guard against /0
  })
})

describe('RaceTrack', () => {
  it('renders one lane per team', () => {
    render(<RaceTrack state={state()} />)
    expect(screen.getByLabelText('Team 1 spaceship')).toBeInTheDocument()
    expect(screen.getByLabelText('Team 4 spaceship')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/spaceship/)).toHaveLength(4)
  })

  it('positions each ship by its score', () => {
    render(<RaceTrack state={state()} />)
    expect(screen.getByLabelText('Team 1 spaceship')).toHaveStyle({ left: '0%' })
    expect(screen.getByLabelText('Team 2 spaceship')).toHaveStyle({ left: '50%' })
    expect(screen.getByLabelText('Team 3 spaceship')).toHaveStyle({ left: '100%' })
  })

  it('shows each lane position out of the finish line', () => {
    render(<RaceTrack state={state()} />)
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.getByText('2/10')).toBeInTheDocument()
  })

  it('highlights the current team only while there is no winner', () => {
    const { container, rerender } = render(<RaceTrack state={state({ currentTeam: 2 })} />)
    expect(container.querySelector('[data-team="2"]')).toHaveClass('is-current')

    rerender(<RaceTrack state={state({ currentTeam: 2, winner: 3 })} />)
    expect(container.querySelector('[data-team="2"]')).not.toHaveClass('is-current')
    expect(container.querySelector('[data-team="3"]')).toHaveClass('is-winner')
  })

  it('adapts to fewer teams', () => {
    render(<RaceTrack state={state({ positions: [0, 0], teamNames: ['A', 'B'] })} />)
    expect(screen.getAllByLabelText(/spaceship/)).toHaveLength(2)
  })

  it('renders nothing without state', () => {
    const { container } = render(<RaceTrack state={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
