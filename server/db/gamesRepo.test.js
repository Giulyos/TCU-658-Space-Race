import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'
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

describe('gamesRepo', () => {
  it('creates a game and returns it with a parsed team_names array', () => {
    const g = games.create({ name: 'Unit 3 Review', finishLine: 12, teamNames: ['Red', 'Blue'] })
    expect(g.id).toBe(1)
    expect(g.name).toBe('Unit 3 Review')
    expect(g.finish_line).toBe(12)
    expect(g.team_names).toEqual(['Red', 'Blue'])
  })

  it('getAll returns games ordered by id; getById returns one or undefined', () => {
    games.create({ name: 'A', teamNames: ['T1', 'T2'] })
    games.create({ name: 'B', teamNames: ['T1', 'T2'] })
    expect(games.getAll().map((g) => g.name)).toEqual(['A', 'B'])
    expect(games.getById(1).name).toBe('A')
    expect(games.getById(999)).toBeUndefined()
  })

  it('update applies a partial change', () => {
    const g = games.create({ name: 'Old', finishLine: 10, teamNames: ['T1', 'T2'] })
    const updated = games.update(g.id, { name: 'New', finishLine: 20 })
    expect(updated.name).toBe('New')
    expect(updated.finish_line).toBe(20)
    expect(updated.team_names).toEqual(['T1', 'T2']) // untouched
  })

  it('update returns undefined for an unknown id', () => {
    expect(games.update(999, { name: 'x' })).toBeUndefined()
  })

  it('remove deletes the game and its questions together', () => {
    const g = games.create({ name: 'G', teamNames: ['T1', 'T2'] })
    questions.create({ text: 'Q1', correct_answer: 'A1', game_id: g.id })
    questions.create({ text: 'Q2', correct_answer: 'A2', game_id: g.id })

    expect(questions.getAllByGame(g.id)).toHaveLength(2)
    expect(games.remove(g.id)).toBe(true)
    expect(games.getById(g.id)).toBeUndefined()
    expect(questions.getAllByGame(g.id)).toHaveLength(0) // cascade by repo
  })

  it('remove returns false for an unknown id', () => {
    expect(games.remove(999)).toBe(false)
  })
})

describe('questionsRepo game scoping', () => {
  it('getAllByGame returns only that game’s questions', () => {
    const a = games.create({ name: 'A', teamNames: ['T1', 'T2'] })
    const b = games.create({ name: 'B', teamNames: ['T1', 'T2'] })
    questions.create({ text: 'A-Q1', correct_answer: 'x', game_id: a.id })
    questions.create({ text: 'B-Q1', correct_answer: 'x', game_id: b.id })
    questions.create({ text: 'A-Q2', correct_answer: 'x', game_id: a.id })

    expect(questions.getAllByGame(a.id).map((q) => q.text)).toEqual(['A-Q1', 'A-Q2'])
    expect(questions.getAllByGame(b.id).map((q) => q.text)).toEqual(['B-Q1'])
  })
})
