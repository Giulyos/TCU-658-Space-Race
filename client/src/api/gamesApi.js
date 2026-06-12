import { request } from './http.js'

// Game-session API client. Mirrors the /api/games endpoints (saved games, their
// scoped question banks, and activation for play).

export const getGames = () => request('GET', '/games')

export const getGame = (id) => request('GET', `/games/${id}`)

export const createGame = (game) => request('POST', '/games', game)

export const updateGame = (id, fields) => request('PUT', `/games/${id}`, fields)

export const deleteGame = (id) => request('DELETE', `/games/${id}`)

// Loads a saved game for play (returns { state }).
export const activateGame = (id) => request('POST', `/games/${id}/activate`)

export const getGameQuestions = (gameId) => request('GET', `/games/${gameId}/questions`)

export const addGameQuestion = (gameId, question) =>
  request('POST', `/games/${gameId}/questions`, question)
