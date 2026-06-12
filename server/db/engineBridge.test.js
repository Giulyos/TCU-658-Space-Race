import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'
import { createGameStateRepo } from './gameStateRepo.js'
import { createEngineBridge } from './engineBridge.js'
import { startGame, resolveTurn, checkWinner, pause } from '../game/engine.js'

let bridge

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  bridge = createEngineBridge(createGameStateRepo(db))
})

describe('engineBridge', () => {
  it('getState returns the current persisted state', () => {
    expect(bridge.getState().active).toBe(0)
    expect(bridge.getState().positions).toEqual([0, 0, 0, 0])
  })

  it('applies a no-arg engine function and persists the result', () => {
    const started = bridge.applyAndPersist(startGame)
    expect(started.active).toBe(1)
    // persisted: a fresh load reflects the change
    expect(bridge.getState().active).toBe(1)
  })

  it('forwards extra args to the engine function', () => {
    bridge.applyAndPersist(startGame)
    const afterTurn = bridge.applyAndPersist(resolveTurn, { correct: true, pointValue: 3 })
    expect(afterTurn.positions[0]).toBe(3)
    expect(afterTurn.currentTeam).toBe(2)
  })

  it('threads persisted state across successive applications', () => {
    bridge.applyAndPersist(startGame)
    bridge.applyAndPersist(resolveTurn, { correct: true, pointValue: 2 }) // team 1 -> 2
    bridge.applyAndPersist(resolveTurn, { correct: true, pointValue: 5 }) // team 2 -> 5
    expect(bridge.getState().positions).toEqual([2, 5, 0, 0])
  })

  it('persists a winner detected after a turn', () => {
    bridge.applyAndPersist(startGame)
    // walk team 1 to the finish line (finishLine 10)
    for (let i = 0; i < 4; i++) {
      bridge.applyAndPersist(resolveTurn, { correct: true, pointValue: 3 })
      bridge.applyAndPersist(checkWinner)
      // skip the other three teams' turns
      bridge.applyAndPersist(resolveTurn, { correct: false })
      bridge.applyAndPersist(resolveTurn, { correct: false })
      bridge.applyAndPersist(resolveTurn, { correct: false })
      if (bridge.getState().winner !== null) break
    }
    expect(bridge.getState().winner).toBe(1)
  })

  it('pause persists the paused status', () => {
    bridge.applyAndPersist(startGame)
    bridge.applyAndPersist(pause)
    expect(bridge.getState().active).toBe(2)
  })

  it('keeps the engine pure (engine.js imports no database module)', () => {
    const engineSrc = readFileSync(new URL('../game/engine.js', import.meta.url), 'utf8')
    expect(engineSrc).not.toMatch(/from '\.\.?\/.*(database|Repo|db)/i)
  })
})
