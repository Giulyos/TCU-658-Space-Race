import { Router } from 'express'
import defaultBridge from '../db/engineBridge.js'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import { startGame, pickQuestion, resolveTurn, checkWinner, pause, resume } from '../game/engine.js'
import { createInitialState } from '../game/state.js'
import { STATUS, MIN_TEAMS, MAX_TEAMS, MIN_FINISH_LINE } from '../game/constants.js'
import { badRequest } from '../middleware/errors.js'

// Routes for running a game. Exposed as a factory taking an injectable engine
// bridge and questions repo so tests can bind them to an in-memory database;
// server.js uses the default instances via the default export.

// The "active question" is the most recently drawn one — i.e. the last id in
// usedQuestions. Returns the matching question from the bank, or null.
export const findActiveQuestion = (state, bank) => {
  const currentId = state.usedQuestions.at(-1)
  if (currentId === undefined) return null
  return bank.find((q) => q.id === currentId) ?? null
}

export const createGameRouter = ({
  bridge = defaultBridge,
  questionsRepo = defaultQuestionsRepo,
} = {}) => {
  const router = Router()

  // The question bank used for play: the active game's questions when a game is
  // loaded, otherwise all questions (legacy / no game activated yet).
  const bankForPlay = () => {
    const gameId = bridge.getActiveGameId()
    return gameId != null ? questionsRepo.getAllByGame(gameId) : questionsRepo.getAll()
  }

  // Begins a fresh match: resets the game and draws the first question, keeping
  // the question bank and team/finish-line configuration. Shared by /start and
  // /restart (starting fresh and restarting are the same operation — startGame
  // clears positions, winner, and used questions).
  const beginGame = (res) => {
    const bank = bankForPlay()
    if (bank.length === 0) {
      throw badRequest('Cannot start a game with an empty question bank')
    }

    const state = bridge.applyAndPersist((current) =>
      pickQuestion(startGame(current), bank).state,
    )
    res.json({ state, question: findActiveQuestion(state, bank) })
  }

  router.post('/start', (_req, res) => beginGame(res))

  router.post('/turn', (req, res) => {
    if (typeof req.body?.correct !== 'boolean') {
      throw badRequest('correct (boolean) is required')
    }

    const current = bridge.getState()
    if (current.winner !== null) {
      throw badRequest('Game is already finished')
    }
    if (current.active !== STATUS.ACTIVE) {
      throw badRequest('No active game')
    }

    const { correct } = req.body
    const bank = bankForPlay()

    // Resolve the current turn using the active question's point value, check
    // for a winner, and — only if nobody has won — draw the next question. If
    // the bank is exhausted, no new question is drawn (no repeats per session)
    // and the last question simply remains the active one.
    const state = bridge.applyAndPersist((s) => {
      const pointValue = findActiveQuestion(s, bank)?.point_value ?? 1
      const afterTurn = checkWinner(resolveTurn(s, { correct, pointValue }))
      if (afterTurn.winner !== null) return afterTurn
      return pickQuestion(afterTurn, bank).state
    })

    const question = state.winner !== null ? null : findActiveQuestion(state, bank)
    res.json({ state, question })
  })

  // Configure the game before a match: finish line and team names (their count
  // defines the number of teams). Applying settings resets to a fresh
  // not-started game with the new configuration. Unspecified fields keep their
  // current value.
  router.put('/settings', (req, res) => {
    const current = bridge.getState()
    const finishLine = req.body?.finishLine ?? current.finishLine
    const teamNames = req.body?.teamNames ?? current.teamNames

    if (!Number.isInteger(finishLine) || finishLine < MIN_FINISH_LINE) {
      throw badRequest(`finishLine must be an integer >= ${MIN_FINISH_LINE}`)
    }
    if (!Array.isArray(teamNames) || teamNames.length < MIN_TEAMS || teamNames.length > MAX_TEAMS) {
      throw badRequest(`teamNames must have between ${MIN_TEAMS} and ${MAX_TEAMS} entries`)
    }
    if (teamNames.some((n) => typeof n !== 'string' || n.trim() === '')) {
      throw badRequest('every team name must be a non-empty string')
    }

    const state = bridge.applyAndPersist(() => createInitialState({ finishLine, teamNames }))
    res.json({ state })
  })

  router.get('/state', (_req, res) => {
    const state = bridge.getState()
    // Once a team has won there is no active question to answer (consistent
    // with the response from /turn on a winning move).
    const question = state.winner !== null ? null : findActiveQuestion(state, bankForPlay())
    res.json({ state, question })
  })

  router.post('/restart', (_req, res) => beginGame(res))

  // Pause/resume toggle the active status. Each is a no-op on the engine side
  // if the game is not in the expected state, so they are always safe to call.
  router.post('/pause', (_req, res) => {
    const state = bridge.applyAndPersist(pause)
    res.json({ state, question: findActiveQuestion(state, bankForPlay()) })
  })

  router.post('/resume', (_req, res) => {
    const state = bridge.applyAndPersist(resume)
    res.json({ state, question: findActiveQuestion(state, bankForPlay()) })
  })

  return router
}

export default createGameRouter()
