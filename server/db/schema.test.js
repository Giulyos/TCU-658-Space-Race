import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { initializeSchema } from './schema.js'

const tableColumns = (db, table) =>
  Object.fromEntries(
    db.prepare(`PRAGMA table_info(${table})`).all().map((c) => [c.name, c]),
  )

describe('questions table schema', () => {
  it('creates the questions table with the expected columns', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    const cols = tableColumns(db, 'questions')
    expect(Object.keys(cols).sort()).toEqual(
      ['id', 'text', 'correct_answer', 'distractors', 'point_value', 'created_at'].sort(),
    )
    db.close()
  })

  it('enforces NOT NULL on text and correct_answer and defaults point_value to 1', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    const cols = tableColumns(db, 'questions')
    expect(cols.text.notnull).toBe(1)
    expect(cols.correct_answer.notnull).toBe(1)
    expect(cols.point_value.notnull).toBe(1)
    expect(cols.point_value.dflt_value).toBe('1')
    db.close()
  })

  it('applies the point_value default and autoincrement id on insert', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    db.prepare('INSERT INTO questions (text, correct_answer) VALUES (?, ?)').run('Q', 'A')
    const row = db.prepare('SELECT * FROM questions').get()
    expect(row.id).toBe(1)
    expect(row.point_value).toBe(1)
    expect(row.created_at).toBeTruthy()
    db.close()
  })

  it('rejects a question with no text (NOT NULL)', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    expect(() =>
      db.prepare('INSERT INTO questions (correct_answer) VALUES (?)').run('A'),
    ).toThrow()
    db.close()
  })

  it('is idempotent (CREATE TABLE IF NOT EXISTS)', () => {
    const db = new Database(':memory:')
    initializeSchema(db)
    expect(() => initializeSchema(db)).not.toThrow()
    db.close()
  })
})
