import { useState } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import {
  startGame,
  submitTurn,
  restartGame,
  pauseGame,
  resumeGame,
} from '../api/gameApi.js'

// Teacher's in-game controls: Start, Correct/Incorrect, Pause/Resume, Restart,
// and Mute. Status comes from useGameState so buttons enable/disable to match
// the current game (not started / active / paused / finished). Mute is a local,
// persisted preference (localStorage) that the Game Screen reads to silence its
// sound effects.

const STATUS = { NOT_STARTED: 0, ACTIVE: 1, PAUSED: 2 }
const MUTE_KEY = 'spacerace:muted'

function TurnControls() {
  const { state, refresh } = useGameState()
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

  const active = state?.active ?? STATUS.NOT_STARTED
  const hasWinner = state?.winner != null
  const inPlay = active === STATUS.ACTIVE && !hasWinner
  const started = active !== STATUS.NOT_STARTED

  return (
    <section>
      <h2>Game Controls</h2>
      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={() => run(startGame)} disabled={inPlay || active === STATUS.PAUSED}>
        Start Game
      </button>

      <button type="button" onClick={() => run(() => submitTurn(true))} disabled={!inPlay}>
        Correct
      </button>
      <button type="button" onClick={() => run(() => submitTurn(false))} disabled={!inPlay}>
        Incorrect
      </button>

      {active === STATUS.PAUSED ? (
        <button type="button" onClick={() => run(resumeGame)}>
          Resume
        </button>
      ) : (
        <button type="button" onClick={() => run(pauseGame)} disabled={!inPlay}>
          Pause
        </button>
      )}

      <button type="button" onClick={() => run(restartGame)} disabled={!started}>
        Restart
      </button>

      <button type="button" onClick={toggleMute} aria-pressed={muted}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </section>
  )
}

export default TurnControls
