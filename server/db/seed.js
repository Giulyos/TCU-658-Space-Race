import { readFileSync } from 'node:fs'
import defaultDb from './database.js'

// Seeds a built-in example game so a fresh database always has one ready to
// play. Idempotent: does nothing if any game already exists. Accepts a db handle
// so it can be tested against an in-memory database.

const sampleQuestions = JSON.parse(
  readFileSync(new URL('../game/sample-questions.json', import.meta.url)),
)

export const seedExampleGame = (db = defaultDb) => {
  const gameCount = db.prepare('SELECT COUNT(*) AS n FROM games').get().n
  if (gameCount > 0) return // already have games — don't duplicate

  const info = db
    .prepare('INSERT INTO games (name, finish_line, team_names) VALUES (?, ?, ?)')
    .run(
      'Example Game — English Basics',
      10,
      JSON.stringify(['Team 1', 'Team 2', 'Team 3', 'Team 4']),
    )
  const gameId = info.lastInsertRowid

  const insert = db.prepare(
    'INSERT INTO questions (game_id, text, correct_answer, point_value) VALUES (?, ?, ?, ?)',
  )
  const insertAll = db.transaction((rows) => {
    for (const q of rows) insert.run(gameId, q.text, q.correct_answer, q.point_value ?? 1)
  })
  insertAll(sampleQuestions)
}
