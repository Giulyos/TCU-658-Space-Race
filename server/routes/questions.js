import { Router } from 'express'
import defaultQuestionsRepo from '../db/questionsRepo.js'
import { badRequest, notFound } from '../middleware/errors.js'

// Routes for the question bank. Exposed as a factory taking an injectable repo
// so tests can bind it to an in-memory database; server.js uses the default
// instance via the default export.
//
// Validation failures and not-found cases are signalled by throwing HttpError;
// the central error middleware (middleware/errors.js) turns these into the
// consistent { error } JSON response.

// Validates a question payload for create/update. Returns an error message
// string, or null when the payload is acceptable. `partial` allows missing
// fields (used by PUT in #20).
export const validateQuestion = (body, { partial = false } = {}) => {
  const has = (k) => body[k] !== undefined

  if ((!partial || has('text')) && (typeof body.text !== 'string' || body.text.trim() === '')) {
    return 'text is required and must be a non-empty string'
  }
  if (
    (!partial || has('correct_answer')) &&
    (typeof body.correct_answer !== 'string' || body.correct_answer.trim() === '')
  ) {
    return 'correct_answer is required and must be a non-empty string'
  }
  if (has('point_value') && (!Number.isInteger(body.point_value) || body.point_value < 1)) {
    return 'point_value must be an integer >= 1'
  }
  if (has('distractors') && !Array.isArray(body.distractors)) {
    return 'distractors must be an array'
  }
  return null
}

export const createQuestionsRouter = (repo = defaultQuestionsRepo) => {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json(repo.getAll())
  })

  router.post('/', (req, res) => {
    const error = validateQuestion(req.body ?? {})
    if (error) throw badRequest(error)

    const created = repo.create(req.body)
    res.status(201).json(created)
  })

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id)
    const error = validateQuestion(req.body ?? {}, { partial: true })
    if (error) throw badRequest(error)

    const updated = repo.update(id, req.body ?? {})
    if (!updated) throw notFound('Question not found')

    res.json(updated)
  })

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!repo.remove(id)) throw notFound('Question not found')

    res.status(204).end()
  })

  return router
}

export default createQuestionsRouter()
