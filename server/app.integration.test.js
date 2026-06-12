import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { createApp } from './app.js'
import { initializeSchema } from './db/schema.js'
import { createQuestionsRepo } from './db/questionsRepo.js'
import { createGameStateRepo } from './db/gameStateRepo.js'
import { createEngineBridge } from './db/engineBridge.js'

// End-to-end test of the whole API wired exactly like server.js (both routers +
// error middleware), backed by a single in-memory database shared by the repos.
let app

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  const questionsRepo = createQuestionsRepo(db)
  const bridge = createEngineBridge(createGameStateRepo(db))
  app = createApp({ questionsRepo, bridge })
})

describe('API integration — a complete game', () => {
  it('seeds questions, starts, plays turns, and reaches a winner', async () => {
    // 1. Teacher builds the question bank.
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/api/questions')
        .send({ text: `Q${i}`, correct_answer: `A${i}`, point_value: 2 })
      expect(res.status).toBe(201)
    }
    expect((await request(app).get('/api/questions')).body).toHaveLength(3)

    // 2. Start the game — first question is drawn.
    const start = await request(app).post('/api/game/start')
    expect(start.status).toBe(200)
    expect(start.body.state.active).toBe(1)
    expect(start.body.question).not.toBeNull()

    // 3. Play until someone wins: team 1 always correct, others always wrong,
    //    so team 1 marches to the finish line (default 10).
    let winner = null
    for (let i = 0; i < 100 && winner === null; i++) {
      const turn = await request(app).post('/api/game/turn').send({ correct: true }) // current team correct
      winner = turn.body.state.winner
      if (winner !== null) break
      // the other three teams miss
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
      const after = await request(app).get('/api/game/state')
      winner = after.body.state.winner
    }

    // 4. Verify the end state: team 1 won, reached the finish line.
    const final = await request(app).get('/api/game/state')
    expect(final.body.state.winner).toBe(1)
    expect(final.body.state.positions[0]).toBeGreaterThanOrEqual(final.body.state.finishLine)
    expect(final.body.question).toBeNull() // no active question once won

    // 5. Turns are rejected after the game is finished.
    const late = await request(app).post('/api/game/turn').send({ correct: true })
    expect(late.status).toBe(400)
    expect(late.body.error).toMatch(/finished/i)

    // 6. Restart returns to a fresh, playable game keeping the bank.
    const restart = await request(app).post('/api/game/restart')
    expect(restart.body.state.winner).toBeNull()
    expect(restart.body.state.positions).toEqual([0, 0, 0, 0])
    expect((await request(app).get('/api/questions')).body).toHaveLength(3)
  })

  it('reports health and a JSON 404 for unknown API routes', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' })
    const missing = await request(app).get('/api/nope')
    expect(missing.status).toBe(404)
    expect(missing.body.error).toMatch(/not found/i)
  })
})
