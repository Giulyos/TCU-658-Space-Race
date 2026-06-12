import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import { initializeSchema } from '../db/schema.js'
import { createQuestionsRepo } from '../db/questionsRepo.js'
import { createQuestionsRouter } from './questions.js'

let app

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  const repo = createQuestionsRepo(db)
  app = express()
  app.use(express.json())
  app.use('/api/questions', createQuestionsRouter(repo))
})

describe('GET /api/questions', () => {
  it('returns an empty array when the bank is empty', async () => {
    const res = await request(app).get('/api/questions')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns created questions with parsed distractors', async () => {
    await request(app)
      .post('/api/questions')
      .send({ text: 'Q1', correct_answer: 'A1', distractors: ['x', 'y'], point_value: 2 })

    const res = await request(app).get('/api/questions')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      id: 1,
      text: 'Q1',
      correct_answer: 'A1',
      distractors: ['x', 'y'],
      point_value: 2,
    })
  })
})

describe('POST /api/questions', () => {
  it('creates a question and returns 201 with the new record', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ text: 'Past tense of go?', correct_answer: 'went' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBe(1)
    expect(res.body.text).toBe('Past tense of go?')
    expect(res.body.point_value).toBe(1) // default
    expect(res.body.distractors).toEqual([]) // default
  })

  it('rejects a missing text with 400', async () => {
    const res = await request(app).post('/api/questions').send({ correct_answer: 'A' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/text/)
  })

  it('rejects a missing correct_answer with 400', async () => {
    const res = await request(app).post('/api/questions').send({ text: 'Q' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/correct_answer/)
  })

  it('rejects a point_value below 1 with 400', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ text: 'Q', correct_answer: 'A', point_value: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/point_value/)
  })

  it('rejects a non-array distractors with 400', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ text: 'Q', correct_answer: 'A', distractors: 'nope' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/distractors/)
  })
})
