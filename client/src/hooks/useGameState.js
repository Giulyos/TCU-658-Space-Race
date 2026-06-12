import { useCallback, useEffect, useRef, useState } from 'react'
import { getState } from '../api/gameApi.js'

// Polls GET /api/game/state on an interval so a screen stays in sync with the
// server. The Game Screen and Admin Panel both rely on this. Returns the latest
// { state, question } plus loading/error flags and a manual refresh().
//
// @param {number} [intervalMs] Poll interval in ms (default 1000).
export const useGameState = (intervalMs = 1000) => {
  const [state, setState] = useState(null)
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tracks whether the hook is still mounted so a late response from an
  // in-flight request never updates state after unmount.
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getState()
      if (!mountedRef.current) return
      setState(data.state)
      setQuestion(data.question)
      setError(null)
    } catch (err) {
      if (mountedRef.current) setError(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    // Polling is a subscription to an external system: fetch once now, then on
    // each interval. refresh() only updates state asynchronously (after await),
    // so this is not a synchronous setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [refresh, intervalMs])

  return { state, question, loading, error, refresh }
}
