import defaultDb from './database.js'
import { createInitialState } from '../game/state.js'

// Data-access layer for the single game_state row (id = 1). This is the only
// place that bridges the database representation (snake_case columns, JSON-
// encoded arrays) and the engine's state shape (camelCase, real arrays — see
// server/game/state.js). Callers — including the engine bridge — only ever see
// the engine shape.
//
// Exposed as a factory so tests can bind it to an in-memory database; a default
// instance bound to the shared connection is exported for the app.

const SINGLETON_ID = 1

// DB row (snake_case + JSON strings) -> engine state (camelCase + arrays).
const toEngineState = (row) => ({
  active: row.active,
  currentTeam: row.current_team,
  positions: JSON.parse(row.positions),
  finishLine: row.finish_line,
  teamNames: JSON.parse(row.team_names),
  usedQuestions: JSON.parse(row.used_questions),
  currentQuestion: row.current_question ?? null,
  winner: row.winner ?? null,
})

export const createGameStateRepo = (db = defaultDb) => {
  // Returns the current game state in the engine shape. Assumes the singleton
  // row exists (bootstrapped by initializeSchema).
  const load = () =>
    toEngineState(
      db.prepare('SELECT * FROM game_state WHERE id = ?').get(SINGLETON_ID),
    )

  // Persists an engine-shape state into the singleton row, JSON-encoding the
  // arrays and refreshing updated_at. Returns the saved state (reloaded).
  const save = (state) => {
    db
      .prepare(
        `UPDATE game_state
            SET active = ?, current_team = ?, positions = ?, finish_line = ?,
                team_names = ?, used_questions = ?, current_question = ?, winner = ?,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .run(
        state.active,
        state.currentTeam,
        JSON.stringify(state.positions),
        state.finishLine,
        JSON.stringify(state.teamNames),
        JSON.stringify(state.usedQuestions),
        state.currentQuestion ?? null,
        state.winner,
        SINGLETON_ID,
      )
    return load()
  }

  // The id of the game currently loaded for play (or null if none).
  const getActiveGameId = () =>
    db.prepare('SELECT game_id FROM game_state WHERE id = ?').get(SINGLETON_ID).game_id ?? null

  // Loads a saved game for play: records which game is active and resets the
  // singleton to a fresh not-started state using that game's finish line and
  // team names. Returns the new engine state.
  const activate = (game) => {
    const init = createInitialState({
      finishLine: game.finish_line,
      teamNames: game.team_names,
    })
    db
      .prepare(
        `UPDATE game_state
            SET game_id = ?, active = ?, current_team = ?, positions = ?,
                finish_line = ?, team_names = ?, used_questions = ?,
                current_question = ?, winner = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .run(
        game.id,
        init.active,
        init.currentTeam,
        JSON.stringify(init.positions),
        init.finishLine,
        JSON.stringify(init.teamNames),
        JSON.stringify(init.usedQuestions),
        init.currentQuestion ?? null,
        init.winner,
        SINGLETON_ID,
      )
    return load()
  }

  return { load, save, getActiveGameId, activate }
}

export default createGameStateRepo()
