import { Router } from 'express'
import defaultBridge from '../db/engineBridge.js'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import { startGame, pickQuestion, resolveTurn, checkWinner } from '../game/engine.js'
import { STATUS } from '../game/constants.js'
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

  // Begins a fresh match: resets the game and draws the first question, keeping
  // the question bank and team/finish-line configuration. Shared by /start and
  // /restart (starting fresh and restarting are the same operation — startGame
  // clears positions, winner, and used questions).
  const beginGame = (res) => {
    const bank = questionsRepo.getAll()
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
    const bank = questionsRepo.getAll()

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

  router.get('/state', (_req, res) => {
    const state = bridge.getState()
    // Once a team has won there is no active question to answer (consistent
    // with the response from /turn on a winning move).
    const question = state.winner !== null ? null : findActiveQuestion(state, questionsRepo.getAll())
    res.json({ state, question })
  })

  router.post('/restart', (_req, res) => beginGame(res))

  return router
}

export default createGameRouter()
