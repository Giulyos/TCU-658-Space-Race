import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'
import { createGameStateRepo } from './gameStateRepo.js'
import { createInitialState } from '../game/state.js'
import { startGame, resolveTurn } from '../game/engine.js'

let db
let repo

beforeEach(() => {
  db = new Database(':memory:')
  initializeSchema(db)
  repo = createGameStateRepo(db)
})

describe('gameStateRepo', () => {
  it('loads the bootstrapped singleton in the engine state shape', () => {
    const state = repo.load()
    expect(state).toEqual({
      active: 0,
      currentTeam: 1,
      positions: [0, 0, 0, 0],
      finishLine: 10,
      teamNames: ['Team 1', 'Team 2', 'Team 3', 'Team 4'],
      usedQuestions: [],
      winner: null,
    })
  })

  it('saves an engine state and reloads it identically (round-trip)', () => {
    const state = {
      active: 1,
      currentTeam: 3,
      positions: [2, 5, 1, 0],
      finishLine: 12,
      teamNames: ['Red', 'Blue', 'Green', 'Gold'],
      usedQuestions: [4, 7, 1],
      winner: null,
    }
    repo.save(state)
    expect(repo.load()).toEqual(state)
  })

  it('persists a winner and reads it back as a number', () => {
    const state = { ...repo.load(), active: 1, positions: [0, 0, 0, 12], winner: 4 }
    repo.save(state)
    expect(repo.load().winner).toBe(4)
  })

  it('keeps writing to the single row (never inserts a second)', () => {
    repo.save({ ...repo.load(), currentTeam: 2 })
    repo.save({ ...repo.load(), currentTeam: 3 })
    const count = db.prepare('SELECT COUNT(*) AS n FROM game_state').get().n
    expect(count).toBe(1)
  })

  it('round-trips a state produced by the engine', () => {
    const engineState = resolveTurn(startGame(createInitialState()), {
      correct: true,
      pointValue: 2,
    })
    repo.save(engineState)
    expect(repo.load()).toEqual(engineState)
  })
})
