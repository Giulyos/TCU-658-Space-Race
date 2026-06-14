import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Validates the shape of the bundled sample question bank so a malformed edit
// is caught before it reaches the CLI demo or the DB seed.
const questions = JSON.parse(
  readFileSync(new URL('./sample-questions.json', import.meta.url)),
)

describe('sample-questions.json', () => {
  it('is a non-empty array of questions', () => {
    expect(Array.isArray(questions)).toBe(true)
    expect(questions.length).toBeGreaterThanOrEqual(15)
  })

  it('has unique ids', () => {
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every question the required fields and a valid point value', () => {
    for (const q of questions) {
      expect(typeof q.id).toBe('number')
      expect(typeof q.text).toBe('string')
      expect(q.text.length).toBeGreaterThan(0)
      expect(typeof q.correct_answer).toBe('string')
      expect(q.correct_answer.length).toBeGreaterThan(0)
      expect(Number.isInteger(q.point_value)).toBe(true)
      expect(q.point_value).toBeGreaterThanOrEqual(1)
    }
  })

  it('includes a mix of point values (not all worth the same)', () => {
    const values = new Set(questions.map((q) => q.point_value))
    expect(values.size).toBeGreaterThan(1)
  })
})
