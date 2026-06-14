import { Router } from 'express'
import defaultBridge from '../db/engineBridge.js'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import { startGame, pickQuestion, resolveTurn, checkWinner, pause, resume } from '../game/engine.js'
import { createInitialState } from '../game/state.js'
import { STATUS, MIN_TEAMS, MAX_TEAMS, MIN_FINISH_LINE, MAX_FINISH_LINE } from '../game/constants.js'
import { badRequest } from '../middleware/errors.js'

// Routes for running a game. Exposed as a factory taking an injectable engine
// bridge and questions repo so tests can bind them to an in-memory database;
// server.js uses the default instances via the default export.

// The question currently on screen (teacher-revealed). Returns the matching
// question from the bank, or null when nothing is being shown.
export const findActiveQuestion = (state, bank) => {
  if (state.currentQuestion == null) return null
  return bank.find((q) => q.id === state.currentQuestion) ?? null
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

  // Begins a fresh match: resets positions/winner/used questions and starts the
  // game with NO question showing (the teacher reveals the first one via /next).
  // Keeps the question bank and team/finish-line configuration. Shared by /start
  // and /restart.
  const beginGame = (res) => {
    const bank = bankForPlay()
    if (bank.length === 0) {
      throw badRequest('Cannot start a game with an empty question bank')
    }

    // A fresh random map seed each start/restart drives the board's visual
    // variants (planets, etc.). Generated here, at the IO boundary, so the
    // engine stays pure.
    const mapSeed = Math.floor(Math.random() * 2_000_000_000)
    const state = bridge.applyAndPersist((current) => ({ ...startGame(current), mapSeed }))
    res.json({ state, question: null })
  }

  router.post('/start', (_req, res) => beginGame(res))

  // Reveals the next question for the current team. Teacher-paced: the board
  // sits with no question until this is called.
  router.post('/next', (_req, res) => {
    const current = bridge.getState()
    if (current.active !== STATUS.ACTIVE) throw badRequest('No active game')
    if (current.winner !== null) throw badRequest('Game is already finished')
    if (current.currentQuestion != null) throw badRequest('Resolve the current question first')

    const bank = bankForPlay()
    const available = bank.filter((q) => !current.usedQuestions.includes(q.id))
    if (available.length === 0) {
      throw badRequest('No more questions available — add questions or restart')
    }

    const state = bridge.applyAndPersist((s) => {
      const picked = pickQuestion(s, bank)
      return { ...picked.state, currentQuestion: picked.question.id }
    })
    res.json({ state, question: findActiveQuestion(state, bank) })
  })

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
    if (current.currentQuestion == null) {
      throw badRequest('No question to mark — reveal one first')
    }

    const { correct } = req.body
    const bank = bankForPlay()

    // Resolve the current turn using the showing question's point value, check
    // for a winner, and clear the current question. The next question is NOT
    // auto-drawn — the teacher reveals it with /next after the board is shown.
    const state = bridge.applyAndPersist((s) => {
      const pointValue = findActiveQuestion(s, bank)?.point_value ?? 1
      const afterTurn = checkWinner(resolveTurn(s, { correct, pointValue }))
      return { ...afterTurn, currentQuestion: null }
    })

    res.json({ state, question: null })
  })

  // Configure the game before a match: finish line and team names (their count
  // defines the number of teams). Applying settings resets to a fresh
  // not-started game with the new configuration. Unspecified fields keep their
  // current value.
  router.put('/settings', (req, res) => {
    const current = bridge.getState()
    const finishLine = req.body?.finishLine ?? current.finishLine
    const teamNames = req.body?.teamNames ?? current.teamNames

    if (!Number.isInteger(finishLine) || finishLine < MIN_FINISH_LINE || finishLine > MAX_FINISH_LINE) {
      throw badRequest(`finishLine must be an integer between ${MIN_FINISH_LINE} and ${MAX_FINISH_LINE}`)
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
    res.json({ state, question: findActiveQuestion(state, bankForPlay()) })
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
