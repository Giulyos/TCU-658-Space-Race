import RaceTrack from '../components/RaceTrack.jsx'
import { useGameState } from '../hooks/useGameState.js'

// The projected, student-facing view. It polls /api/game/state and renders the
// race. QuestionDisplay, TurnIndicator, Scoreboard and the winner banner are
// added in #34/#35; for now it shows the race track once a game is loaded.
function GameScreen() {
  const { state, loading, error } = useGameState()

  return (
    <main>
      <h1>Space Race</h1>

      {error && <p role="alert">Could not reach the game server.</p>}
      {loading && !state && <p>Loading…</p>}

      {state && state.active === 0 ? (
        <p>Waiting for the teacher to start a game…</p>
      ) : (
        <RaceTrack state={state} />
      )}
    </main>
  )
}

export default GameScreen
