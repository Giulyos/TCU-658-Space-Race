import { Router } from 'express'
import defaultGamesRepo from '../db/gamesRepo.js'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import defaultBridge from '../db/engineBridge.js'
import { validateQuestion } from './questions.js'
import { MIN_TEAMS, MAX_TEAMS, MIN_FINISH_LINE, MAX_FINISH_LINE } from '../game/constants.js'
import { badRequest, notFound } from '../middleware/errors.js'

// Routes for persisted game sessions: CRUD over saved games, activating a game
// for play, and managing a game's own question bank. Exposed as a factory with
// injectable dependencies so tests can bind them to an in-memory database.

// Validates a game payload. Returns an error message string, or null when valid.
// `partial` allows missing fields (used by PUT).
export const validateGame = (body, { partial = false } = {}) => {
  const has = (k) => body[k] !== undefined

  if ((!partial || has('name')) && (typeof body.name !== 'string' || body.name.trim() === '')) {
    return 'name is required and must be a non-empty string'
  }
  if (
    has('finishLine') &&
    (!Number.isInteger(body.finishLine) ||
      body.finishLine < MIN_FINISH_LINE ||
      body.finishLine > MAX_FINISH_LINE)
  ) {
    return `finishLine must be an integer between ${MIN_FINISH_LINE} and ${MAX_FINISH_LINE}`
  }
  if (!partial || has('teamNames')) {
    const { teamNames } = body
    if (!Array.isArray(teamNames) || teamNames.length < MIN_TEAMS || teamNames.length > MAX_TEAMS) {
      return `teamNames must have between ${MIN_TEAMS} and ${MAX_TEAMS} entries`
    }
    if (teamNames.some((n) => typeof n !== 'string' || n.trim() === '')) {
      return 'every team name must be a non-empty string'
    }
  }
  return null
}

export const createGamesRouter = ({
  gamesRepo = defaultGamesRepo,
  questionsRepo = defaultQuestionsRepo,
  bridge = defaultBridge,
} = {}) => {
  const router = Router()

  // Loads a game by :id param or throws 404. Used by the nested routes.
  const requireGame = (id) => {
    const game = gamesRepo.getById(Number(id))
    if (!game) throw notFound('Game not found')
    return game
  }

  router.get('/', (_req, res) => {
    res.json(gamesRepo.getAll())
  })

  router.post('/', (req, res) => {
    const error = validateGame(req.body ?? {})
    if (error) throw badRequest(error)
    res.status(201).json(gamesRepo.create(req.body))
  })

  router.get('/:id', (req, res) => {
    res.json(requireGame(req.params.id))
  })

  router.put('/:id', (req, res) => {
    const error = validateGame(req.body ?? {}, { partial: true })
    if (error) throw badRequest(error)
    const updated = gamesRepo.update(Number(req.params.id), req.body ?? {})
    if (!updated) throw notFound('Game not found')
    res.json(updated)
  })

  router.delete('/:id', (req, res) => {
    if (!gamesRepo.remove(Number(req.params.id))) throw notFound('Game not found')
    res.status(204).end()
  })

  // Load a game for play: resets the shared game state to this game's config.
  router.post('/:id/activate', (req, res) => {
    const game = requireGame(req.params.id)
    const state = bridge.activateGame(game)
    res.json({ state })
  })

  // A game's question bank (scoped). PUT/DELETE on individual questions stay on
  // /api/questions/:id (they operate by question id).
  router.get('/:gameId/questions', (req, res) => {
    requireGame(req.params.gameId)
    res.json(questionsRepo.getAllByGame(Number(req.params.gameId)))
  })

  router.post('/:gameId/questions', (req, res) => {
    requireGame(req.params.gameId)
    const error = validateQuestion(req.body ?? {})
    if (error) throw badRequest(error)
    const created = questionsRepo.create({ ...req.body, game_id: Number(req.params.gameId) })
    res.status(201).json(created)
  })

  return router
}

export default createGamesRouter()
