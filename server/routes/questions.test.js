import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import { initializeSchema } from '../db/schema.js'
import { createQuestionsRepo } from '../db/questionsRepo.js'
import { createQuestionsRouter } from './questions.js'
import { errorHandler } from '../middleware/errors.js'

let app

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  const repo = createQuestionsRepo(db)
  app = express()
  app.use(express.json())
  app.use('/api/questions', createQuestionsRouter(repo))
  app.use(errorHandler)
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

// Helper to seed one question and return its id.
const seed = async (body = { text: 'Q', correct_answer: 'A' }) =>
  (await request(app).post('/api/questions').send(body)).body.id

describe('PUT /api/questions/:id', () => {
  it('updates an existing question and returns it', async () => {
    const id = await seed({ text: 'Q', correct_answer: 'A', point_value: 1 })
    const res = await request(app)
      .put(`/api/questions/${id}`)
      .send({ point_value: 3, distractors: ['b', 'c'] })

    expect(res.status).toBe(200)
    expect(res.body.point_value).toBe(3)
    expect(res.body.distractors).toEqual(['b', 'c'])
    expect(res.body.text).toBe('Q') // untouched field preserved
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).put('/api/questions/999').send({ text: 'x' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/i)
  })

  it('validates fields when present (400 on bad point_value)', async () => {
    const id = await seed()
    const res = await request(app).put(`/api/questions/${id}`).send({ point_value: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/point_value/)
  })

  it('rejects emptying a required field (400 on blank text)', async () => {
    const id = await seed()
    const res = await request(app).put(`/api/questions/${id}`).send({ text: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/text/)
  })
})

describe('DELETE /api/questions/:id', () => {
  it('deletes an existing question and returns 204', async () => {
    const id = await seed()
    const res = await request(app).delete(`/api/questions/${id}`)
    expect(res.status).toBe(204)

    const list = await request(app).get('/api/questions')
    expect(list.body).toEqual([])
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/questions/999')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/i)
  })
})
