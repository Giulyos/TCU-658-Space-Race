import { describe, it, expect } from 'vitest'
import { renderTrack } from './cli.js'
import { startGame } from './engine.js'
import { createInitialState } from './state.js'

describe('renderTrack', () => {
  it('renders one lane per team', () => {
    const state = startGame(createInitialState({ finishLine: 10 }))
    const lines = renderTrack(state).split('\n')
    expect(lines).toHaveLength(4)
    expect(renderTrack(state)).toContain('Team 1')
    expect(renderTrack(state)).toContain('Team 4')
  })

  it('marks the team whose turn it is with an arrow', () => {
    const state = { ...startGame(createInitialState({ finishLine: 10 })), currentTeam: 2 }
    const lines = renderTrack(state).split('\n')
    expect(lines[1].startsWith('→')).toBe(true)
    expect(lines[0].startsWith('→')).toBe(false)
  })

  it('shows each team position out of the finish line', () => {
    const state = { ...startGame(createInitialState({ finishLine: 10 })), positions: [3, 0, 0, 0] }
    expect(renderTrack(state)).toContain('3/10')
    expect(renderTrack(state)).toContain('0/10')
  })

  it('places the ship and finish flag in every lane', () => {
    const state = startGame(createInitialState({ finishLine: 10 }))
    for (const line of renderTrack(state).split('\n')) {
      expect(line).toContain('🚀')
      expect(line).toContain('🏁')
    }
  })
})
