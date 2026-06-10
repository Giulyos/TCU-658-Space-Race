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
      id INTEGER PRIMARY KEY AUTOINCREMENT
      -- TODO(#15): implement game_state schema + singleton row
    );
  `)
}
