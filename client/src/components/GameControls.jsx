import { useState } from 'react'
import { nextQuestion, pauseGame, resumeGame } from '../api/gameApi.js'
import { isMuted, setMuted } from '../sound/sounds.js'
import { navigateTo } from '../lib/nav.js'

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

function GameControls({ state, question, refresh }) {
  const [error, setError] = useState(null)
  // Mute is a shared preference (see sound/sounds.js): the toggle writes it and
  // the sound player reads it, both via MUTE_KEY in localStorage.
  const [muted, setMutedState] = useState(() => isMuted())

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
    setMutedState((prev) => {
      const next = !prev
      setMuted(next)
      return next
    })
  }

  // Back to the teacher's Admin Panel (sits next to Pause/Resume).
  const goHome = () => navigateTo('/admin')

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
          <button type="button" className="nes-btn" onClick={goHome}>
            Home
          </button>
          <button type="button" className="nes-btn is-warning" onClick={() => run(pauseGame)}>
            Pause
          </button>
          <button type="button" className="nes-btn" onClick={toggleMute} aria-pressed={muted}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}

      {paused && (
        <>
          {/* gray out the whole board, no popup */}
          <div className="pause-grayout" aria-hidden="true" />
          {/* Home + Resume sit where Pause was (top-right), above the gray-out */}
          <div className="hud hud-topright">
            <button type="button" className="nes-btn" onClick={goHome}>
              Home
            </button>
            <button type="button" className="nes-btn is-warning" onClick={() => run(resumeGame)}>
              Resume
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default GameControls
