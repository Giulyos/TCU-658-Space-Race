import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Board from './Board.jsx'
import { layoutFor, makeWindingPath, sampleAlong, planetVariant } from './boardLayout.js'

const close = (a, b, eps = 0.001) => Math.abs(a - b) < eps

describe('boardLayout', () => {
  it('places the finish and starts per team count', () => {
    expect(layoutFor(2).starts).toHaveLength(2)
    expect(layoutFor(3).starts).toHaveLength(3)
    expect(layoutFor(4).starts).toHaveLength(4)
    // 2 and 3 finish at top-center; 4 finishes at the center
    expect(layoutFor(2).finish).toEqual([50, 16])
    expect(layoutFor(3).finish).toEqual([50, 16])
    expect(layoutFor(4).finish).toEqual([50, 50])
    // 3-team starts: bottom-left, bottom-center, bottom-right
    expect(layoutFor(3).starts.map((s) => s[0])).toEqual([16, 50, 84])
  })

  it('winding path begins at start and ends at finish', () => {
    const path = makeWindingPath([10, 90], [50, 16])
    expect(path[0]).toEqual([10, 90])
    expect(path[path.length - 1]).toEqual([50, 16])
    expect(path.length).toBeGreaterThan(2) // has interior twists
  })

  it('sampleAlong returns n+1 points from start to finish', () => {
    const path = makeWindingPath([0, 0], [10, 0], 2, 0) // straight line, no twist
    const pts = sampleAlong(path, 10)
    expect(pts).toHaveLength(11)
    expect(close(pts[0][0], 0)).toBe(true)
    expect(close(pts[10][0], 10)).toBe(true)
    expect(close(pts[5][0], 5)).toBe(true) // evenly spaced
  })
})

describe('planetVariant', () => {
  it('is deterministic for a given seed + slot', () => {
    expect(planetVariant(12345, 0, 5)).toBe(planetVariant(12345, 0, 5))
  })

  it('stays within range and varies by slot / seed', () => {
    for (let slot = 0; slot < 6; slot++) {
      const v = planetVariant(999, slot, 5)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(5)
    }
    // different seeds generally produce different maps for the same slot
    const a = [0, 1, 2].map((s) => planetVariant(s, 0, 5))
    expect(new Set(a).size).toBeGreaterThan(1)
  })
})

const state = (over = {}) => ({
  active: 1,
  currentTeam: 1,
  positions: [0, 3, 6, 10],
  finishLine: 10,
  teamNames: ['Red', 'Blue', 'Green', 'Gold'],
  winner: null,
  mapSeed: 42,
  ...over,
})

describe('Board', () => {
  it('renders one ship per team', () => {
    const { container } = render(<Board state={state()} />)
    expect(container.querySelectorAll('.board-ship')).toHaveLength(4)
  })

  it('renders a home planet per team plus the finish planet', () => {
    const { container } = render(<Board state={state()} />)
    // 4 home planets + 1 finish planet
    expect(container.querySelectorAll('.pixel-planet')).toHaveLength(5)
    expect(container.querySelector('[aria-label="Finish planet"]')).toBeInTheDocument()
  })

  it('adapts to 2 and 3 teams', () => {
    const { container: c2 } = render(
      <Board state={state({ positions: [0, 0], teamNames: ['A', 'B'] })} />,
    )
    expect(c2.querySelectorAll('.board-ship')).toHaveLength(2)

    const { container: c3 } = render(
      <Board state={state({ positions: [0, 0, 0], teamNames: ['A', 'B', 'C'] })} />,
    )
    expect(c3.querySelectorAll('.board-ship')).toHaveLength(3)
  })

  it('puts a ship at its start (pos 0) and at the finish (pos = finishLine)', () => {
    const { container } = render(<Board state={state()} />)
    const { finish, starts } = layoutFor(4)
    const ship = (team) => container.querySelector(`.board-ship[data-team="${team}"]`)
    const xy = (g) => [Number(g.getAttribute('data-x')), Number(g.getAttribute('data-y'))]
    // team 1 at position 0 -> its start corner
    expect(close(xy(ship(1))[0], starts[0][0])).toBe(true)
    expect(close(xy(ship(1))[1], starts[0][1])).toBe(true)
    // team 4 at position 10 (finishLine) -> the finish
    expect(close(xy(ship(4))[0], finish[0])).toBe(true)
    expect(close(xy(ship(4))[1], finish[1])).toBe(true)
  })

  it('marks the current team and the winner', () => {
    const { container, rerender } = render(<Board state={state({ currentTeam: 2 })} />)
    expect(container.querySelector('.board-ship[data-team="2"]')).toHaveClass('is-current')
    rerender(<Board state={state({ currentTeam: 2, winner: 3 })} />)
    expect(container.querySelector('.board-ship[data-team="2"]')).not.toHaveClass('is-current')
    expect(container.querySelector('.board-ship[data-team="3"]')).toHaveClass('is-winner')
  })

  it('renders nothing without state', () => {
    const { container } = render(<Board state={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
