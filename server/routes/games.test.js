import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import Database from 'better-sqlite3'
import { initializeSchema } from '../db/schema.js'
import { createGamesRepo } from '../db/gamesRepo.js'
import { createQuestionsRepo } from '../db/questionsRepo.js'
import { createGameStateRepo } from '../db/gameStateRepo.js'
import { createEngineBridge } from '../db/engineBridge.js'
import { createGamesRouter } from './games.js'
import { createGameRouter } from './game.js'
import { errorHandler } from '../middleware/errors.js'

let app
let gamesRepo

beforeEach(() => {
  const db = new Database(':memory:')
  initializeSchema(db)
  gamesRepo = createGamesRepo(db)
  const questionsRepo = createQuestionsRepo(db)
  const bridge = createEngineBridge(createGameStateRepo(db))

  app = express()
  app.use(express.json())
  app.use('/api/games', createGamesRouter({ gamesRepo, questionsRepo, bridge }))
  app.use('/api/game', createGameRouter({ bridge, questionsRepo }))
  app.use(errorHandler)
})

const newGame = (over = {}) => ({
  name: 'Unit 3',
  finishLine: 10,
  teamNames: ['Red', 'Blue'],
  ...over,
})

describe('games CRUD', () => {
  it('creates a game (201) and lists it', async () => {
    const res = await request(app).post('/api/games').send(newGame())
    expect(res.status).toBe(201)
    expect(res.body.id).toBe(1)
    expect(res.body.team_names).toEqual(['Red', 'Blue'])

    const list = await request(app).get('/api/games')
    expect(list.body).toHaveLength(1)
  })

  it('rejects a game with no name (400)', async () => {
    const res = await request(app).post('/api/games').send(newGame({ name: '' }))
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/name/)
  })

  it('rejects an invalid team count (400)', async () => {
    const res = await request(app).post('/api/games').send(newGame({ teamNames: ['Solo'] }))
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/teamNames/)
  })

  it('gets one game or 404', async () => {
    const { body } = await request(app).post('/api/games').send(newGame())
    expect((await request(app).get(`/api/games/${body.id}`)).body.name).toBe('Unit 3')
    expect((await request(app).get('/api/games/999')).status).toBe(404)
  })

  it('updates a game (partial) and 404s for unknown id', async () => {
    const { body } = await request(app).post('/api/games').send(newGame())
    const upd = await request(app).put(`/api/games/${body.id}`).send({ name: 'Renamed' })
    expect(upd.body.name).toBe('Renamed')
    expect(upd.body.finish_line).toBe(10) // untouched
    expect((await request(app).put('/api/games/999').send({ name: 'x' })).status).toBe(404)
  })

  it('deletes a game (204) and 404s for unknown id', async () => {
    const { body } = await request(app).post('/api/games').send(newGame())
    expect((await request(app).delete(`/api/games/${body.id}`)).status).toBe(204)
    expect((await request(app).delete(`/api/games/${body.id}`)).status).toBe(404)
  })
})

describe("a game's question bank (scoped)", () => {
  it('adds and lists questions under the game', async () => {
    const { body: game } = await request(app).post('/api/games').send(newGame())

    const created = await request(app)
      .post(`/api/games/${game.id}/questions`)
      .send({ text: 'Q1', correct_answer: 'A1', point_value: 2 })
    expect(created.status).toBe(201)
    expect(created.body.game_id).toBe(game.id)

    const list = await request(app).get(`/api/games/${game.id}/questions`)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].text).toBe('Q1')
  })

  it('keeps each game’s bank separate', async () => {
    const { body: a } = await request(app).post('/api/games').send(newGame({ name: 'A' }))
    const { body: b } = await request(app).post('/api/games').send(newGame({ name: 'B' }))
    await request(app).post(`/api/games/${a.id}/questions`).send({ text: 'A1', correct_answer: 'x' })
    await request(app).post(`/api/games/${b.id}/questions`).send({ text: 'B1', correct_answer: 'x' })

    expect((await request(app).get(`/api/games/${a.id}/questions`)).body).toHaveLength(1)
    expect((await request(app).get(`/api/games/${a.id}/questions`)).body[0].text).toBe('A1')
  })

  it('404s when adding a question to an unknown game', async () => {
    const res = await request(app).post('/api/games/999/questions').send({ text: 'Q', correct_answer: 'A' })
    expect(res.status).toBe(404)
  })
})

describe('activation drives game play', () => {
  it('activates a game and plays a turn from its bank', async () => {
    const { body: game } = await request(app)
      .post('/api/games')
      .send(newGame({ finishLine: 5, teamNames: ['Red', 'Blue', 'Green'] }))
    await request(app)
      .post(`/api/games/${game.id}/questions`)
      .send({ text: 'Q1', correct_answer: 'A1', point_value: 2 })

    const activated = await request(app).post(`/api/games/${game.id}/activate`)
    expect(activated.status).toBe(200)
    expect(activated.body.state.finishLine).toBe(5)
    expect(activated.body.state.teamNames).toEqual(['Red', 'Blue', 'Green'])
    expect(activated.body.state.positions).toEqual([0, 0, 0])

    // Start + reveal + a turn now use the activated game's question bank.
    await request(app).post('/api/game/start')
    const revealed = await request(app).post('/api/game/next')
    expect(revealed.body.question.text).toBe('Q1')
    const turn = await request(app).post('/api/game/turn').send({ correct: true })
    expect(turn.body.state.positions[0]).toBe(2) // advanced by the question's points
  })

  it('404s activating an unknown game', async () => {
    expect((await request(app).post('/api/games/999/activate')).status).toBe(404)
  })
})
