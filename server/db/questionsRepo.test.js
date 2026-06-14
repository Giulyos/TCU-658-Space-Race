import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'
import { createQuestionsRepo } from './questionsRepo.js'

let db
let repo

beforeEach(() => {
  db = new Database(':memory:')
  initializeSchema(db)
  repo = createQuestionsRepo(db)
})

describe('questionsRepo', () => {
  it('creates a question and returns it', () => {
    const q = repo.create({ text: 'Past tense of go?', correct_answer: 'went', point_value: 2 })
    expect(q.id).toBe(1)
    expect(q.text).toBe('Past tense of go?')
    expect(q.correct_answer).toBe('went')
    expect(q.point_value).toBe(2)
  })

  it('defaults point_value to 1 when omitted', () => {
    const q = repo.create({ text: 'Q', correct_answer: 'A' })
    expect(q.point_value).toBe(1)
  })

  it('getAll returns all questions ordered by id', () => {
    repo.create({ text: 'Q1', correct_answer: 'A1' })
    repo.create({ text: 'Q2', correct_answer: 'A2' })

    const all = repo.getAll()
    expect(all.map((q) => q.id)).toEqual([1, 2])
    expect(all.map((q) => q.text)).toEqual(['Q1', 'Q2'])
  })

  it('getById returns the question or undefined for an unknown id', () => {
    const created = repo.create({ text: 'Q', correct_answer: 'A' })
    expect(repo.getById(created.id).text).toBe('Q')
    expect(repo.getById(999)).toBeUndefined()
  })

  it('update applies a partial change', () => {
    const q = repo.create({ text: 'Q', correct_answer: 'A', point_value: 1 })
    const updated = repo.update(q.id, { point_value: 3 })
    expect(updated.point_value).toBe(3)
    expect(updated.text).toBe('Q') // untouched field preserved
  })

  it('update returns undefined for an unknown id', () => {
    expect(repo.update(999, { text: 'x' })).toBeUndefined()
  })

  it('remove deletes an existing question and reports success', () => {
    const q = repo.create({ text: 'Q', correct_answer: 'A' })
    expect(repo.remove(q.id)).toBe(true)
    expect(repo.getById(q.id)).toBeUndefined()
  })

  it('remove returns false for an unknown id', () => {
    expect(repo.remove(999)).toBe(false)
  })
})
