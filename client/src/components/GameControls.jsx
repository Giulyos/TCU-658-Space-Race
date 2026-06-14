import { useState } from 'react'
import { nextQuestion, pauseGame, resumeGame } from '../api/gameApi.js'

// The teacher's during-game controls, shown on the projected board itself.
// State-driven:
//   - active, no question showing: Next Question (+ Pause)
//   - a question is showing:       (Correct / Incorrect live on the popup)
//   - paused:                      Resume
//   - winner:                      no controls (the winner banner takes over)
// Mute (a local, persisted preference the board reads for sounds) appears only
// alongside Next Question — i.e. when no popup is up. Launch (activate + start)
// and Restart live on the Admin panel.

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
  // Controls are shown when the game is active with no question popup up.
  const ready = !hasWinner && active === STATUS.ACTIVE && !showingQuestion
  const paused = !hasWinner && active === STATUS.PAUSED

  return (
    <>
      {error && (
        <p className="hud hud-error" role="alert">
          {error}
        </p>
      )}

      {ready && (
        <div className="hud hud-bottom">
          <button type="button" className="nes-btn is-primary" onClick={() => run(nextQuestion)}>
            Next Question
          </button>
        </div>
      )}

      {ready && (
        <div className="hud hud-topright">
          <button type="button" className="nes-btn is-warning" onClick={() => run(pauseGame)}>
            Pause
          </button>
          <button type="button" className="nes-btn" onClick={toggleMute} aria-pressed={muted}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}

      {paused && (
        <div className="pause-overlay" role="dialog" aria-label="Paused">
          <div className="pause-card nes-container is-dark">
            <p className="pause-title">⏸ Paused</p>
            <button type="button" className="nes-btn is-warning" onClick={() => run(resumeGame)}>
              Resume
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GameControls
