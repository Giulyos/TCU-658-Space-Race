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
      ['id', 'game_id', 'text', 'correct_answer', 'distractors', 'point_value', 'created_at'].sort(),
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
        'id', 'game_id', 'active', 'current_team', 'positions', 'finish_line',
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

describe('games table + game_id columns', () => {
  it('creates the games table and game_id columns on a fresh database', () => {
    const db = new Database(':memory:')
    initializeSchema(db)

    expect(Object.keys(tableColumns(db, 'games')).sort()).toEqual(
      ['id', 'name', 'finish_line', 'team_names', 'created_at', 'updated_at'].sort(),
    )
    expect(tableColumns(db, 'questions')).toHaveProperty('game_id')
    expect(tableColumns(db, 'game_state')).toHaveProperty('game_id')
    db.close()
  })

  it('creates no Default Game on a fresh (empty) database', () => {
    const db = new Database(':memory:')
    initializeSchema(db)
    expect(db.prepare('SELECT COUNT(*) AS n FROM games').get().n).toBe(0)
    db.close()
  })
})

describe('legacy migration (pre-M4.5 database)', () => {
  // Builds an old-style database: questions/game_state WITHOUT game_id, no games table.
  const legacyDb = () => {
    const db = new Database(':memory:')
    db.exec(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL, correct_answer TEXT NOT NULL,
        distractors TEXT, point_value INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE game_state (
        id INTEGER PRIMARY KEY DEFAULT 1, active INTEGER NOT NULL DEFAULT 0,
        current_team INTEGER NOT NULL DEFAULT 1, positions TEXT NOT NULL DEFAULT '[0,0,0,0]',
        finish_line INTEGER NOT NULL DEFAULT 10,
        team_names TEXT NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
        used_questions TEXT NOT NULL DEFAULT '[]', winner INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    db.prepare('INSERT INTO game_state (id) VALUES (1)').run()
    db.prepare('UPDATE game_state SET finish_line = 15, team_names = ? WHERE id = 1').run(
      '["Red","Blue"]',
    )
    db.prepare('INSERT INTO questions (text, correct_answer) VALUES (?, ?)').run('Q1', 'A1')
    db.prepare('INSERT INTO questions (text, correct_answer) VALUES (?, ?)').run('Q2', 'A2')
    return db
  }

  it('upgrades the schema and moves orphan questions into a Default Game', () => {
    const db = legacyDb()
    initializeSchema(db)

    const games = db.prepare('SELECT * FROM games').all()
    expect(games).toHaveLength(1)
    expect(games[0].name).toBe('Default Game')
    // Default Game inherits the previous game_state config
    expect(games[0].finish_line).toBe(15)
    expect(games[0].team_names).toBe('["Red","Blue"]')

    const gid = games[0].id
    const attached = db.prepare('SELECT COUNT(*) AS n FROM questions WHERE game_id = ?').get(gid).n
    expect(attached).toBe(2)
    expect(db.prepare('SELECT game_id FROM game_state WHERE id = 1').get().game_id).toBe(gid)
    db.close()
  })

  it('is idempotent: a second init does not create another Default Game', () => {
    const db = legacyDb()
    initializeSchema(db)
    initializeSchema(db)
    expect(db.prepare('SELECT COUNT(*) AS n FROM games').get().n).toBe(1)
    db.close()
  })
})
