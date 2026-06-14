import { describe, it, expect } from 'vitest'
import { createInitialState } from './state.js'
import { STATUS, DEFAULT_FINISH_LINE, DEFAULT_TEAM_COUNT } from './constants.js'

describe('createInitialState', () => {
  it('returns the canonical default shape', () => {
    const state = createInitialState()
    expect(state).toEqual({
      active: STATUS.NOT_STARTED,
      currentTeam: 1,
      positions: [0, 0, 0, 0],
      finishLine: DEFAULT_FINISH_LINE,
      teamNames: ['Team 1', 'Team 2', 'Team 3', 'Team 4'],
      usedQuestions: [],
      currentQuestion: null,
      mapSeed: null,
      winner: null,
    })
    expect(state.positions).toHaveLength(DEFAULT_TEAM_COUNT)
  })

  it('honors a custom finish line and explicit team names', () => {
    const state = createInitialState({ finishLine: 15, teamNames: ['Red', 'Blue'] })
    expect(state.finishLine).toBe(15)
    expect(state.teamNames).toEqual(['Red', 'Blue'])
    expect(state.positions).toEqual([0, 0])
  })

  it('derives team count and names from teamCount when no names are given', () => {
    const state = createInitialState({ teamCount: 3 })
    expect(state.teamNames).toEqual(['Team 1', 'Team 2', 'Team 3'])
    expect(state.positions).toEqual([0, 0, 0])
  })

  it('does not share mutable arrays between instances', () => {
    const a = createInitialState()
    a.positions[0] = 5
    a.usedQuestions.push(42)

    const b = createInitialState()
    expect(b.positions[0]).toBe(0)
    expect(b.usedQuestions).toEqual([])
  })
})
