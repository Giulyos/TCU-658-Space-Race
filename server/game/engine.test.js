import { describe, it, expect } from 'vitest'
import { startGame } from './engine.js'
import { createInitialState } from './state.js'
import { STATUS } from './constants.js'

describe('startGame', () => {
  it('activates the game with team 1 on the move', () => {
    const started = startGame(createInitialState())
    expect(started.active).toBe(STATUS.ACTIVE)
    expect(started.currentTeam).toBe(1)
  })

  it('resets positions to the starting line, preserving team count', () => {
    const started = startGame(createInitialState({ teamCount: 3 }))
    expect(started.positions).toEqual([0, 0, 0])
  })

  it('clears any prior winner and used-question history', () => {
    const inProgress = {
      ...createInitialState(),
      positions: [4, 7, 2, 9],
      winner: 4,
      usedQuestions: [1, 2, 3],
      currentTeam: 3,
    }
    const started = startGame(inProgress)
    expect(started.winner).toBeNull()
    expect(started.usedQuestions).toEqual([])
    expect(started.positions).toEqual([0, 0, 0, 0])
    expect(started.currentTeam).toBe(1)
  })

  it('preserves configuration (team names and finish line)', () => {
    const config = createInitialState({ teamNames: ['Red', 'Blue'], finishLine: 15 })
    const started = startGame(config)
    expect(started.teamNames).toEqual(['Red', 'Blue'])
    expect(started.finishLine).toBe(15)
  })

  it('does not mutate the input state', () => {
    const original = createInitialState()
    const snapshot = structuredClone(original)
    startGame(original)
    expect(original).toEqual(snapshot)
  })
})
