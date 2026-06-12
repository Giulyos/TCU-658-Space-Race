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
