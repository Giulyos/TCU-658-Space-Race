import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { HttpError, badRequest, notFound, notFoundHandler, errorHandler } from './errors.js'

// Builds an app whose single route throws the provided error.
const appThrowing = (err) => {
  const app = express()
  app.use(express.json())
  app.get('/boom', () => {
    throw err
  })
  app.use(errorHandler)
  return app
}

describe('HttpError + helpers', () => {
  it('carries a status code and message', () => {
    const e = new HttpError(418, 'teapot')
    expect(e.statusCode).toBe(418)
    expect(e.message).toBe('teapot')
    expect(e).toBeInstanceOf(Error)
  })

  it('badRequest -> 400, notFound -> 404', () => {
    expect(badRequest('x').statusCode).toBe(400)
    expect(notFound('y').statusCode).toBe(404)
  })
})

describe('errorHandler', () => {
  let errSpy
  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => errSpy.mockRestore())

  it('renders a client HttpError as { error } with its status', async () => {
    const res = await request(appThrowing(badRequest('bad thing'))).get('/boom')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'bad thing' })
  })

  it('hides details of unexpected (500) errors and logs them', async () => {
    const res = await request(appThrowing(new Error('secret internals'))).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(res.body.error).not.toMatch(/secret/)
    expect(errSpy).toHaveBeenCalled()
  })

  it('respects a body-parser style err.status (malformed JSON -> 400)', async () => {
    const app = express()
    app.use(express.json())
    app.post('/x', (_req, res) => res.json({ ok: true }))
    app.use(errorHandler)

    const res = await request(app)
      .post('/x')
      .set('Content-Type', 'application/json')
      .send('{ not valid json')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

describe('notFoundHandler', () => {
  it('produces a JSON 404 for unmatched routes', async () => {
    const app = express()
    app.use('/api', notFoundHandler)
    app.use(errorHandler)

    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/i)
  })
})
