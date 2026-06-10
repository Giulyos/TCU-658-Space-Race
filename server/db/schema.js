import defaultDb from './database.js'

// Initializes the database schema. Accepts a database handle so the schema can
// be created against an in-memory database in tests; defaults to the shared
// file-backed connection used by the running server.
export const initializeSchema = (db = defaultDb) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      text           TEXT    NOT NULL,
      correct_answer TEXT    NOT NULL,
      distractors    TEXT,                        -- JSON array stored as a string
      point_value    INTEGER NOT NULL DEFAULT 1,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_state (
      id             INTEGER PRIMARY KEY DEFAULT 1,
      active         INTEGER NOT NULL DEFAULT 0,    -- 0 = not started, 1 = active, 2 = paused
      current_team   INTEGER NOT NULL DEFAULT 1,    -- 1-4
      positions      TEXT    NOT NULL DEFAULT '[0,0,0,0]',
      finish_line    INTEGER NOT NULL DEFAULT 10,
      team_names     TEXT    NOT NULL DEFAULT '["Team 1","Team 2","Team 3","Team 4"]',
      used_questions TEXT    NOT NULL DEFAULT '[]',
      winner         INTEGER,                        -- NULL or team number 1-4
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // The game has exactly one persisted state: a single row with id = 1. Bootstrap
  // it on first init so the rest of the app can always read/update an existing row.
  db.prepare('INSERT OR IGNORE INTO game_state (id) VALUES (1)').run()
}
