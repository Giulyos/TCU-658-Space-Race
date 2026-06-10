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

describe('game_state table schema', () => {
  it('creates the game_state table with the expected columns', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    const cols = tableColumns(db, 'game_state')
    expect(Object.keys(cols).sort()).toEqual(
      [
        'id', 'active', 'current_team', 'positions', 'finish_line',
        'team_names', 'used_questions', 'winner', 'updated_at',
      ].sort(),
    )
    db.close()
  })

  it('bootstraps exactly one singleton row with id = 1 and documented defaults', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    const rows = db.prepare('SELECT * FROM game_state').all()
    expect(rows).toHaveLength(1)

    const state = rows[0]
    expect(state.id).toBe(1)
    expect(state.active).toBe(0)
    expect(state.current_team).toBe(1)
    expect(state.positions).toBe('[0,0,0,0]')
    expect(state.finish_line).toBe(10)
    expect(state.team_names).toBe('["Team 1","Team 2","Team 3","Team 4"]')
    expect(state.used_questions).toBe('[]')
    expect(state.winner).toBeNull()
    expect(state.updated_at).toBeTruthy()
    db.close()
  })

  it('does not duplicate the singleton row on repeated init', () => {
    const db = new Database(':memory:')
    initializeSchema(db)
    initializeSchema(db)

    const count = db.prepare('SELECT COUNT(*) AS n FROM game_state').get().n
    expect(count).toBe(1)
    db.close()
  })

  it('preserves an existing row across re-init (INSERT OR IGNORE)', () => {
    const db = new Database(':memory:')
    initializeSchema(db)
    db.prepare('UPDATE game_state SET active = 1, winner = 3 WHERE id = 1').run()

    initializeSchema(db)
    const state = db.prepare('SELECT active, winner FROM game_state WHERE id = 1').get()
    expect(state.active).toBe(1)
    expect(state.winner).toBe(3)
    db.close()
  })
})
