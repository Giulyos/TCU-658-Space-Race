import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'
import { seedExampleGame } from './seed.js'
import { createGamesRepo } from './gamesRepo.js'
import { createQuestionsRepo } from './questionsRepo.js'

let db
let games
let questions

beforeEach(() => {
  db = new Database(':memory:')
  initializeSchema(db)
  games = createGamesRepo(db)
  questions = createQuestionsRepo(db)
})

describe('seedExampleGame', () => {
  it('creates one example game with questions on a fresh database', () => {
    seedExampleGame(db)

    const all = games.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].name).toMatch(/example/i)
    expect(all[0].finish_line).toBe(10)
    expect(all[0].team_names).toHaveLength(4)
    expect(questions.getAllByGame(all[0].id).length).toBeGreaterThanOrEqual(15)
  })

  it('is idempotent: does not duplicate on repeated calls', () => {
    seedExampleGame(db)
    seedExampleGame(db)
    expect(games.getAll()).toHaveLength(1)
  })

  it('does nothing when a game already exists', () => {
    games.create({ name: 'My Game', teamNames: ['A', 'B'] })
    seedExampleGame(db)
    expect(games.getAll()).toHaveLength(1)
    expect(games.getAll()[0].name).toBe('My Game')
  })
})
