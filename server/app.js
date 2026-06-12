import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { createQuestionsRouter } from './routes/questions.js'
import { createGameRouter } from './routes/game.js'
import { createGamesRouter } from './routes/games.js'
import { notFoundHandler, errorHandler } from './middleware/errors.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Builds the Express application. Dependencies are injectable so tests can wire
// the routers to an in-memory database; when omitted, the routers fall back to
// the default file-backed instances used by the running server.
//
// @param {object}  [opts]
// @param {object}  [opts.questionsRepo]  Questions repository (default instance if omitted).
// @param {object}  [opts.gamesRepo]      Games repository (default instance if omitted).
// @param {object}  [opts.bridge]         Engine/persistence bridge (default instance if omitted).
// @param {boolean} [opts.serveStatic]    Serve the built client (production).
export const createApp = ({ questionsRepo, gamesRepo, bridge, serveStatic = false } = {}) => {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/games', createGamesRouter({ gamesRepo, questionsRepo, bridge }))
  app.use('/api/questions', createQuestionsRouter(questionsRepo))
  app.use('/api/game', createGameRouter({ bridge, questionsRepo }))

  // Unmatched /api/* routes return a consistent JSON 404.
  app.use('/api', notFoundHandler)

  if (serveStatic) {
    const clientDistPath = path.resolve(__dirname, '../client/dist')
    app.use(express.static(clientDistPath))
  }

  // Central error handler — must be registered last.
  app.use(errorHandler)

  return app
}
