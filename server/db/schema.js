import defaultDb from './database.js'

const DEFAULT_TEAM_NAMES = '["Team 1","Team 2","Team 3","Team 4"]'

// Whether a column already exists on a table (used to upgrade older databases).
const hasColumn = (db, table, column) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)

// Migrates a pre-M4.5 database (questions with no game_id) into a single
// "Default Game" so no question bank is lost when game sessions are introduced.
// The Default Game inherits the finish line and team names that were previously
// held on the singleton game_state row. No-op for fresh or already-migrated DBs.
const migrateLegacyQuestions = (db) => {
  const orphans = db
    .prepare('SELECT COUNT(*) AS n FROM questions WHERE game_id IS NULL')
    .get().n
  if (orphans === 0) return

  const prev = db.prepare('SELECT finish_line, team_names FROM game_state WHERE id = 1').get()
  const info = db
    .prepare('INSERT INTO games (name, finish_line, team_names) VALUES (?, ?, ?)')
    .run('Default Game', prev?.finish_line ?? 10, prev?.team_names ?? DEFAULT_TEAM_NAMES)
  const gameId = info.lastInsertRowid

  db.prepare('UPDATE questions SET game_id = ? WHERE game_id IS NULL').run(gameId)
  db.prepare('UPDATE game_state SET game_id = ? WHERE id = 1 AND game_id IS NULL').run(gameId)
}

// Initializes the database schema. Accepts a database handle so the schema can
// be created against an in-memory database in tests; defaults to the shared
// file-backed connection used by the running server.
export const initializeSchema = (db = defaultDb) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      finish_line INTEGER NOT NULL DEFAULT 10,
      team_names  TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id        INTEGER REFERENCES games(id),  -- the game this question belongs to
      text           TEXT    NOT NULL,
      correct_answer TEXT    NOT NULL,
      distractors    TEXT,                           -- JSON array stored as a string
      point_value    INTEGER NOT NULL DEFAULT 1,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_state (
      id             INTEGER PRIMARY KEY DEFAULT 1,
      game_id        INTEGER,                        -- the game currently loaded for play
      active         INTEGER NOT NULL DEFAULT 0,     -- 0 = not started, 1 = active, 2 = paused
      current_team   INTEGER NOT NULL DEFAULT 1,     -- 1-4
      positions      TEXT    NOT NULL DEFAULT '[0,0,0,0]',
      finish_line    INTEGER NOT NULL DEFAULT 10,
      team_names     TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
      used_questions TEXT    NOT NULL DEFAULT '[]',
      winner         INTEGER,                         -- NULL or team number 1-4
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Upgrade databases created before M4.5 by adding the new game_id columns.
  if (!hasColumn(db, 'questions', 'game_id')) {
    db.exec('ALTER TABLE questions ADD COLUMN game_id INTEGER REFERENCES games(id)')
  }
  if (!hasColumn(db, 'game_state', 'game_id')) {
    db.exec('ALTER TABLE game_state ADD COLUMN game_id INTEGER')
  }

  // The game has exactly one persisted state: a single row with id = 1. Bootstrap
  // it on first init so the rest of the app can always read/update an existing row.
  db.prepare('INSERT OR IGNORE INTO game_state (id) VALUES (1)').run()

  migrateLegacyQuestions(db)
}
