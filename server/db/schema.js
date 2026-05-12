import db from './database.js'

export const initializeSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT
      -- TODO: implement questions schema
    );

    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT
      -- TODO: implement game_state schema
    );
  `)
}
