import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as questionsApi from './questionsApi.js'
import * as gameApi from './gameApi.js'

// Builds a fake fetch Response.
const mockResponse = (body, { status = 200 } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
})

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('questionsApi', () => {
  it('getQuestions GETs /api/questions and returns the body', async () => {
    fetchMock.mockResolvedValue(mockResponse([{ id: 1, text: 'Q' }]))
    const result = await questionsApi.getQuestions()

    expect(fetchMock).toHaveBeenCalledWith('/api/questions', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([{ id: 1, text: 'Q' }])
  })

  it('addQuestion POSTs JSON with a content-type header', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 1 }, { status: 201 }))
    await questionsApi.addQuestion({ text: 'Q', correct_answer: 'A' })

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/questions')
    expect(opts.method).toBe('POST')
    expect(opts.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(opts.body)).toEqual({ text: 'Q', correct_answer: 'A' })
  })

  it('updateQuestion PUTs to the id path', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 5, point_value: 3 }))
    await questionsApi.updateQuestion(5, { point_value: 3 })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/questions/5')
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT')
  })

  it('deleteQuestion DELETEs and tolerates a 204 (null) body', async () => {
    fetchMock.mockResolvedValue(mockResponse(undefined, { status: 204 }))
    const result = await questionsApi.deleteQuestion(7)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/questions/7')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
    expect(result).toBeNull()
  })

  it('throws the server error message on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(mockResponse({ error: 'text is required' }, { status: 400 }))
    await expect(questionsApi.addQuestion({})).rejects.toThrow('text is required')
  })
})

describe('gameApi', () => {
  it('getState GETs /api/game/state', async () => {
    fetchMock.mockResolvedValue(mockResponse({ state: { active: 0 }, question: null }))
    const result = await gameApi.getState()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/game/state')
    expect(result.state.active).toBe(0)
  })

  it('startGame POSTs /api/game/start', async () => {
    fetchMock.mockResolvedValue(mockResponse({ state: { active: 1 }, question: { id: 1 } }))
    await gameApi.startGame()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/game/start')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })

  it('submitTurn POSTs { correct } to /api/game/turn', async () => {
    fetchMock.mockResolvedValue(mockResponse({ state: {}, question: null }))
    await gameApi.submitTurn(true)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/game/turn')
    expect(JSON.parse(opts.body)).toEqual({ correct: true })
  })

  it('restartGame POSTs /api/game/restart', async () => {
    fetchMock.mockResolvedValue(mockResponse({ state: { winner: null }, question: { id: 2 } }))
    await gameApi.restartGame()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/game/restart')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })
})
