import { Router } from 'express'
import defaultBridge from '../db/engineBridge.js'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import { startGame, pickQuestion, resolveTurn, checkWinner } from '../game/engine.js'
import { STATUS } from '../game/constants.js'

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

  router.post('/start', (_req, res) => {
    const bank = questionsRepo.getAll()
    if (bank.length === 0) {
      return res.status(400).json({ error: 'Cannot start a game with an empty question bank' })
    }

    // Start a fresh game and draw the first question in one persisted step.
    const state = bridge.applyAndPersist((current) => {
      const started = startGame(current)
      return pickQuestion(started, bank).state
    })

    res.json({ state, question: findActiveQuestion(state, bank) })
  })

  router.post('/turn', (req, res) => {
    if (typeof req.body?.correct !== 'boolean') {
      return res.status(400).json({ error: 'correct (boolean) is required' })
    }

    const current = bridge.getState()
    if (current.winner !== null) {
      return res.status(400).json({ error: 'Game is already finished' })
    }
    if (current.active !== STATUS.ACTIVE) {
      return res.status(400).json({ error: 'No active game' })
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
    res.json({ state, question: findActiveQuestion(state, questionsRepo.getAll()) })
  })

  router.post('/restart', (_req, res) => {
    // TODO(#24): implement
    res.status(501).json({ message: 'Not implemented' })
  })

  return router
}

export default createGameRouter()
