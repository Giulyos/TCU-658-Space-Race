import defaultDb from './database.js'

// Data-access layer for persisted game sessions (the `games` table). Each game
// is a reusable setup: a name, finish line, team names, and its own question
// bank (questions.game_id). This repo is the only place that knows the table's
// SQL and that team_names is stored as a JSON string.
//
// Exposed as a factory so tests can bind it to an in-memory database; a default
// instance bound to the shared connection is exported for the app.

const deserialize = (row) => {
  if (!row) return undefined
  return { ...row, team_names: JSON.parse(row.team_names) }
}

export const createGamesRepo = (db = defaultDb) => {
  const getAll = () =>
    db.prepare('SELECT * FROM games ORDER BY id').all().map(deserialize)

  const getById = (id) =>
    deserialize(db.prepare('SELECT * FROM games WHERE id = ?').get(id))

  const create = ({ name, finishLine = 10, teamNames }) => {
    const info = db
      .prepare('INSERT INTO games (name, finish_line, team_names) VALUES (?, ?, ?)')
      .run(name, finishLine, JSON.stringify(teamNames))
    return getById(info.lastInsertRowid)
  }

  // Partial update: only provided fields change. Returns the updated game, or
  // undefined if no game has the given id.
  const update = (id, { name, finishLine, teamNames }) => {
    const existing = getById(id)
    if (!existing) return undefined

    db
      .prepare(
        `UPDATE games
            SET name = ?, finish_line = ?, team_names = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .run(
        name ?? existing.name,
        finishLine ?? existing.finish_line,
        JSON.stringify(teamNames ?? existing.team_names),
        id,
      )
    return getById(id)
  }

  // Deletes a game and its question bank together (one transaction). Returns
  // true if a game was removed, false if no game had the given id.
  const remove = db.transaction((id) => {
    db.prepare('DELETE FROM questions WHERE game_id = ?').run(id)
    return db.prepare('DELETE FROM games WHERE id = ?').run(id).changes > 0
  })

  return { getAll, getById, create, update, remove }
}

export default createGamesRepo()
