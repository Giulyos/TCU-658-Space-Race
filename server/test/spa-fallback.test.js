import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { initializeSchema } from '../db/schema.js'
import { createGamesRepo } from '../db/gamesRepo.js'
import { createQuestionsRepo } from '../db/questionsRepo.js'
import { createGameStateRepo } from '../db/gameStateRepo.js'
import { createEngineBridge } from '../db/engineBridge.js'
import { createApp } from '../app.js'

// Production static serving + SPA fallback. We point the app at a temp "dist"
// dir with a stub index.html and a static asset, then assert client routes fall
// back to the shell while /api stays JSON and real files are served as-is.
const SHELL = '<!doctype html><html><body><div id="root">APP SHELL</div></body></html>'
const ASSET = 'console.log("bundle")'

let app
let distDir

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), 'spacerace-dist-'))
  writeFileSync(join(distDir, 'index.html'), SHELL)
  writeFileSync(join(distDir, 'bundle.js'), ASSET)

  const db = new Database(':memory:')
  initializeSchema(db)
  const gamesRepo = createGamesRepo(db)
  const questionsRepo = createQuestionsRepo(db)
  const bridge = createEngineBridge({ stateRepo: createGameStateRepo(db) })
  app = createApp({ gamesRepo, questionsRepo, bridge, serveStatic: true, clientDistPath: distDir })
})

afterAll(() => {
  rmSync(distDir, { recursive: true, force: true })
})

describe('production static serving + SPA fallback', () => {
  it('serves the built index.html at the root', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('APP SHELL')
  })

  it('serves real static assets as-is', async () => {
    const res = await request(app).get('/bundle.js')
    expect(res.status).toBe(200)
    expect(res.text).toContain('bundle')
  })

  it('falls back to index.html for client routes (so /admin and /game reload)', async () => {
    for (const route of ['/admin', '/game', '/anything/deep']) {
      const res = await request(app).get(route)
      expect(res.status, route).toBe(200)
      expect(res.text, route).toContain('APP SHELL')
    }
  })

  it('does NOT fall back for unknown /api routes (stays JSON 404)', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
    expect(res.text).not.toContain('APP SHELL')
  })

  it('still serves the API normally', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('without serveStatic (dev/default)', () => {
  it('does not serve the shell — unmatched /api still 404s as JSON', async () => {
    const db = new Database(':memory:')
    initializeSchema(db)
    const devApp = createApp({
      gamesRepo: createGamesRepo(db),
      questionsRepo: createQuestionsRepo(db),
      bridge: createEngineBridge({ stateRepo: createGameStateRepo(db) }),
    })
    const res = await request(devApp).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
