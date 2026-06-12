import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as gamesApi from './gamesApi.js'

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

describe('gamesApi', () => {
  it('getGames GETs /api/games', async () => {
    fetchMock.mockResolvedValue(mockResponse([{ id: 1, name: 'A' }]))
    expect(await gamesApi.getGames()).toEqual([{ id: 1, name: 'A' }])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/games')
  })

  it('createGame POSTs the game body', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 1 }, { status: 201 }))
    await gamesApi.createGame({ name: 'A', teamNames: ['T1', 'T2'] })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/games')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ name: 'A', teamNames: ['T1', 'T2'] })
  })

  it('updateGame PUTs to the id path', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 3 }))
    await gamesApi.updateGame(3, { name: 'New' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/games/3')
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT')
  })

  it('deleteGame DELETEs and tolerates 204', async () => {
    fetchMock.mockResolvedValue(mockResponse(undefined, { status: 204 }))
    expect(await gamesApi.deleteGame(2)).toBeNull()
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('activateGame POSTs the activate path', async () => {
    fetchMock.mockResolvedValue(mockResponse({ state: { active: 0 } }))
    await gamesApi.activateGame(5)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/games/5/activate')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })

  it('getGameQuestions and addGameQuestion hit the scoped path', async () => {
    fetchMock.mockResolvedValue(mockResponse([]))
    await gamesApi.getGameQuestions(7)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/games/7/questions')

    fetchMock.mockResolvedValue(mockResponse({ id: 1 }, { status: 201 }))
    await gamesApi.addGameQuestion(7, { text: 'Q', correct_answer: 'A' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/games/7/questions')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
  })

  it('throws the server error on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(mockResponse({ error: 'name is required' }, { status: 400 }))
    await expect(gamesApi.createGame({})).rejects.toThrow('name is required')
  })
})
