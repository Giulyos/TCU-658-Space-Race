import defaultDb from './database.js'

// Data-access layer for the questions table. The repository is the only place
// that knows the table's SQL. Questions are teacher-judged (no answer choices),
// so a question is just text, a correct answer, and a point value.
//
// Exposed as a factory so tests can bind it to an in-memory database; a default
// instance bound to the shared file-backed connection is exported for the app.

export const createQuestionsRepo = (db = defaultDb) => {
  const getAll = () => db.prepare('SELECT * FROM questions ORDER BY id').all()

  // Questions belonging to a single game (its question bank).
  const getAllByGame = (gameId) =>
    db.prepare('SELECT * FROM questions WHERE game_id = ? ORDER BY id').all(gameId)

  const getById = (id) => db.prepare('SELECT * FROM questions WHERE id = ?').get(id)

  const create = ({ text, correct_answer, point_value = 1, game_id = null }) => {
    const info = db
      .prepare(
        `INSERT INTO questions (text, correct_answer, point_value, game_id)
         VALUES (?, ?, ?, ?)`,
      )
      .run(text, correct_answer, point_value, game_id)
    return getById(info.lastInsertRowid)
  }

  // Partial update: only the provided fields change. Returns the updated
  // question, or undefined if no row has the given id.
  const update = (id, fields) => {
    const existing = getById(id)
    if (!existing) return undefined

    const merged = { ...existing, ...fields }
    db
      .prepare(
        `UPDATE questions
           SET text = ?, correct_answer = ?, point_value = ?
         WHERE id = ?`,
      )
      .run(merged.text, merged.correct_answer, merged.point_value, id)
    return getById(id)
  }

  // Returns true if a row was deleted, false if no row had the given id.
  const remove = (id) =>
    db.prepare('DELETE FROM questions WHERE id = ?').run(id).changes > 0

  return { getAll, getAllByGame, getById, create, update, remove }
}

export default createQuestionsRepo()
