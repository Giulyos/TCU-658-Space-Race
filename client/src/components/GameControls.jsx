import { useState } from 'react'
import { nextQuestion, submitTurn, pauseGame, resumeGame } from '../api/gameApi.js'

// The teacher's during-game controls, shown on the projected board itself.
// State-driven:
//   - active, no question showing: Next Question (+ Pause)
//   - a question is showing:       Correct / Incorrect
//   - paused:                      Resume
//   - winner:                      no controls (the winner banner takes over)
// Plus a Mute toggle (local, persisted preference the board reads for sounds).
// Launch (activate + start) and Restart live on the Admin panel.

const STATUS = { NOT_STARTED: 0, ACTIVE: 1, PAUSED: 2 }
const MUTE_KEY = 'spacerace:muted'

function GameControls({ state, question, refresh }) {
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true')

  // Runs an API action then refreshes the shared game state, surfacing errors.
  const run = async (action) => {
    setError(null)
    try {
      await action()
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev
      localStorage.setItem(MUTE_KEY, String(next))
      return next
    })
  }

  if (!state) return null

  const active = state.active
  const hasWinner = state.winner != null
  const showingQuestion = question != null

  return (
    <section className="game-controls">
      {error && <p role="alert">{error}</p>}

      {!hasWinner && active === STATUS.ACTIVE && !showingQuestion && (
        <>
          <button type="button" className="nes-btn is-primary" onClick={() => run(nextQuestion)}>
            Next Question
          </button>
          <button type="button" className="nes-btn is-warning" onClick={() => run(pauseGame)}>
            Pause
          </button>
        </>
      )}

      {!hasWinner && active === STATUS.ACTIVE && showingQuestion && (
        <>
          <button
            type="button"
            className="nes-btn is-success"
            onClick={() => run(() => submitTurn(true))}
          >
            Correct
          </button>
          <button
            type="button"
            className="nes-btn is-error"
            onClick={() => run(() => submitTurn(false))}
          >
            Incorrect
          </button>
        </>
      )}

      {!hasWinner && active === STATUS.PAUSED && (
        <button type="button" className="nes-btn is-warning" onClick={() => run(resumeGame)}>
          Resume
        </button>
      )}

      <button type="button" className="nes-btn" onClick={toggleMute} aria-pressed={muted}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </section>
  )
}

export default GameControls
