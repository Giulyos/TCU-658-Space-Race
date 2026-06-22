import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { createQuestionsRouter } from './routes/questions.js'
import { createGameRouter } from './routes/game.js'
import { createGamesRouter } from './routes/games.js'
import { notFoundHandler, errorHandler } from './middleware/errors.js'

// Named moduleDir (not __dirname) so it doesn't collide with the CJS __dirname
// that the pkg packager injects when bundling this ESM file.
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

// Builds the Express application. Dependencies are injectable so tests can wire
// the routers to an in-memory database; when omitted, the routers fall back to
// the default file-backed instances used by the running server.
//
// @param {object}  [opts]
// @param {object}  [opts.questionsRepo]  Questions repository (default instance if omitted).
// @param {object}  [opts.gamesRepo]      Games repository (default instance if omitted).
// @param {object}  [opts.bridge]          Engine/persistence bridge (default instance if omitted).
// @param {boolean} [opts.serveStatic]     Serve the built client (production).
// @param {string}  [opts.clientDistPath]  Override the built-client directory (for tests).
export const createApp = ({
  questionsRepo,
  gamesRepo,
  bridge,
  serveStatic = false,
  clientDistPath = path.resolve(moduleDir, '../client/dist'),
} = {}) => {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/games', createGamesRouter({ gamesRepo, questionsRepo, bridge }))
  app.use('/api/questions', createQuestionsRouter(questionsRepo))
  app.use('/api/game', createGameRouter({ bridge, questionsRepo }))

  // Unmatched /api/* routes return a consistent JSON 404 (handled by the error
  // handler below), so they never reach the SPA fallback.
  app.use('/api', notFoundHandler)

  if (serveStatic) {
    app.use(express.static(clientDistPath))

    // SPA fallback: any GET that matched neither /api nor a static file returns
    // the app shell, so client routes (/admin, /game) load on reload. Express 5
    // rejects bare wildcard paths, so this is a pathless GET-only middleware.
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next()
      res.sendFile(path.join(clientDistPath, 'index.html'), (err) => err && next(err))
    })
  }

  // Central error handler — must be registered last.
  app.use(errorHandler)

  return app
}
