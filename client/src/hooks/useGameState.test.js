import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from './useGameState.js'
import { getState } from '../api/gameApi.js'

vi.mock('../api/gameApi.js', () => ({ getState: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
  getState.mockReset()
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('useGameState', () => {
  it('fetches the state on mount and clears loading', async () => {
    getState.mockResolvedValue({ state: { active: 1 }, question: { id: 1 } })
    const { result } = renderHook(() => useGameState(1000))

    expect(result.current.loading).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(0) }) // flush the initial fetch

    expect(result.current.loading).toBe(false)
    expect(result.current.state).toEqual({ active: 1 })
    expect(result.current.question).toEqual({ id: 1 })
    expect(result.current.error).toBeNull()
    expect(getState).toHaveBeenCalledTimes(1)
  })

  it('polls again after the interval elapses', async () => {
    getState.mockResolvedValue({ state: { active: 1 }, question: null })
    renderHook(() => useGameState(1000))

    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(getState).toHaveBeenCalledTimes(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(getState).toHaveBeenCalledTimes(2)

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(getState).toHaveBeenCalledTimes(3)
  })

  it('exposes an error when the request fails', async () => {
    getState.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useGameState(1000))

    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(result.current.error).toBeTruthy()
    expect(result.current.error.message).toBe('network down')
    expect(result.current.loading).toBe(false)
  })

  it('stops polling after unmount', async () => {
    getState.mockResolvedValue({ state: {}, question: null })
    const { unmount } = renderHook(() => useGameState(1000))

    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(getState).toHaveBeenCalledTimes(1)

    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(getState).toHaveBeenCalledTimes(1) // no further polls
  })
})
