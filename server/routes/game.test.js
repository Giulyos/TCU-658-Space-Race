import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import { initializeSchema } from '../db/schema.js'
import { createQuestionsRepo } from '../db/questionsRepo.js'
import { createGameStateRepo } from '../db/gameStateRepo.js'
import { createEngineBridge } from '../db/engineBridge.js'
import { createGameRouter, findActiveQuestion } from './game.js'

let app
let questionsRepo

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  questionsRepo = createQuestionsRepo(db)
  const bridge = createEngineBridge(createGameStateRepo(db))
  app = express()
  app.use(express.json())
  app.use('/api/game', createGameRouter({ bridge, questionsRepo }))
})

const seedBank = () => {
  questionsRepo.create({ text: 'Q1', correct_answer: 'A1', point_value: 1 })
  questionsRepo.create({ text: 'Q2', correct_answer: 'A2', point_value: 2 })
}

describe('findActiveQuestion', () => {
  it('returns null when no question has been drawn', () => {
    expect(findActiveQuestion({ usedQuestions: [] }, [{ id: 1 }])).toBeNull()
  })

  it('returns the most recently drawn question', () => {
    const bank = [{ id: 1 }, { id: 2 }, { id: 3 }]
    expect(findActiveQuestion({ usedQuestions: [2, 1] }, bank)).toEqual({ id: 1 })
  })
})

describe('POST /api/game/start', () => {
  it('starts an active game and returns state plus the first question', async () => {
    seedBank()
    const res = await request(app).post('/api/game/start')

    expect(res.status).toBe(200)
    expect(res.body.state.active).toBe(1)
    expect(res.body.state.currentTeam).toBe(1)
    expect(res.body.state.positions).toEqual([0, 0, 0, 0])
    expect(res.body.state.winner).toBeNull()
    // a question was drawn and is reported as active
    expect(res.body.state.usedQuestions).toHaveLength(1)
    expect(res.body.question).not.toBeNull()
    expect(res.body.question.id).toBe(res.body.state.usedQuestions[0])
  })

  it('persists the started game (a second start re-reads, not duplicates)', async () => {
    seedBank()
    await request(app).post('/api/game/start')
    const res = await request(app).post('/api/game/start')
    // still a valid fresh game with exactly one drawn question
    expect(res.body.state.active).toBe(1)
    expect(res.body.state.usedQuestions).toHaveLength(1)
  })

  it('returns 400 when the question bank is empty', async () => {
    const res = await request(app).post('/api/game/start')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/empty question bank/i)
  })
})

describe('GET /api/game/state', () => {
  it('returns the not-started state with no active question before a game starts', async () => {
    const res = await request(app).get('/api/game/state')
    expect(res.status).toBe(200)
    expect(res.body.state.active).toBe(0)
    expect(res.body.state.positions).toEqual([0, 0, 0, 0])
    expect(res.body.question).toBeNull()
  })

  it('returns the active game and current question after starting', async () => {
    seedBank()
    const started = await request(app).post('/api/game/start')

    const res = await request(app).get('/api/game/state')
    expect(res.status).toBe(200)
    expect(res.body.state.active).toBe(1)
    expect(res.body.question).not.toBeNull()
    // matches what start reported and the last drawn id
    expect(res.body.question.id).toBe(started.body.question.id)
    expect(res.body.question.id).toBe(res.body.state.usedQuestions.at(-1))
  })
})

describe('POST /api/game/turn', () => {
  const start = () => request(app).post('/api/game/start')

  it('advances the current team by the active question point value on correct', async () => {
    seedBank()
    const started = await start()
    const pointValue = started.body.question.point_value

    const res = await request(app).post('/api/game/turn').send({ correct: true })
    expect(res.status).toBe(200)
    expect(res.body.state.positions[0]).toBe(pointValue) // team 1 advanced
    expect(res.body.state.currentTeam).toBe(2) // turn rotated
  })

  it('does not advance on an incorrect answer but still rotates', async () => {
    seedBank()
    await start()
    const res = await request(app).post('/api/game/turn').send({ correct: false })
    expect(res.body.state.positions).toEqual([0, 0, 0, 0])
    expect(res.body.state.currentTeam).toBe(2)
  })

  it('draws a new active question after a (non-winning) turn', async () => {
    seedBank()
    const started = await start()
    const res = await request(app).post('/api/game/turn').send({ correct: false })
    expect(res.body.question).not.toBeNull()
    expect(res.body.question.id).not.toBe(started.body.question.id) // no repeat
    expect(res.body.state.usedQuestions).toHaveLength(2)
  })

  it('detects a winner and reports a null active question', async () => {
    // finish line 3, one big-value question so team 1 wins on the first turn
    questionsRepo.create({ text: 'Big', correct_answer: 'A', point_value: 5 })
    await request(app).post('/api/game/start')
    // force a small finish line via a fresh start is not exposed; instead rely
    // on point_value 5 >= default finish line 10? No — bump with several turns.
    // Simpler: play correct turns for team 1 until it crosses the line.
    let res
    for (let i = 0; i < 20; i++) {
      res = await request(app).post('/api/game/turn').send({ correct: true })
      if (res.body.state.winner !== null) break
      // let the other three teams miss so only team 1 advances
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
    }
    expect(res.body.state.winner).toBe(1)
    expect(res.body.question).toBeNull()
  })

  it('rejects a turn when no game is active (400)', async () => {
    seedBank()
    const res = await request(app).post('/api/game/turn').send({ correct: true })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no active game/i)
  })

  it('rejects a turn after the game is finished (400)', async () => {
    questionsRepo.create({ text: 'Big', correct_answer: 'A', point_value: 5 })
    await request(app).post('/api/game/start')
    let res
    for (let i = 0; i < 20; i++) {
      res = await request(app).post('/api/game/turn').send({ correct: true })
      if (res.body.state.winner !== null) break
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
      await request(app).post('/api/game/turn').send({ correct: false })
    }
    const after = await request(app).post('/api/game/turn').send({ correct: true })
    expect(after.status).toBe(400)
    expect(after.body.error).toMatch(/finished/i)
  })

  it('rejects a non-boolean correct (400)', async () => {
    seedBank()
    await start()
    const res = await request(app).post('/api/game/turn').send({ correct: 'yes' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/correct/i)
  })
})

describe('POST /api/game/restart', () => {
  it('resets a game in progress to a fresh active match', async () => {
    seedBank()
    await request(app).post('/api/game/start')
    await request(app).post('/api/game/turn').send({ correct: true }) // team 1 moves

    const res = await request(app).post('/api/game/restart')
    expect(res.status).toBe(200)
    expect(res.body.state.active).toBe(1)
    expect(res.body.state.currentTeam).toBe(1)
    expect(res.body.state.positions).toEqual([0, 0, 0, 0])
    expect(res.body.state.winner).toBeNull()
    expect(res.body.state.usedQuestions).toHaveLength(1) // fresh first question drawn
    expect(res.body.question).not.toBeNull()
  })

  it('keeps the question bank intact', async () => {
    seedBank()
    await request(app).post('/api/game/start')
    await request(app).post('/api/game/restart')

    const bank = await request(app).get('/api/game/state')
    // bank still has both questions available to draw across a session
    expect(questionsRepo.getAll()).toHaveLength(2)
    expect(bank.body.state.active).toBe(1)
  })

  it('returns 400 when the question bank is empty', async () => {
    const res = await request(app).post('/api/game/restart')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/empty question bank/i)
  })
})
