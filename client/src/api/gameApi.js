import { request } from './http.js'

// Game API client. Mirrors the /api/game endpoints. start/turn/restart return
// { state, question }; getState does too (question is null before start / after a win).

export const getState = () => request('GET', '/game/state')

export const startGame = () => request('POST', '/game/start')

export const submitTurn = (correct) => request('POST', '/game/turn', { correct })

export const restartGame = () => request('POST', '/game/restart')

export const pauseGame = () => request('POST', '/game/pause')

export const resumeGame = () => request('POST', '/game/resume')

export const updateSettings = (settings) => request('PUT', '/game/settings', settings)
