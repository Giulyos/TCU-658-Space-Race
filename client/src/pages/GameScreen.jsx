import Board from '../components/Board.jsx'
import TurnIndicator from '../components/TurnIndicator.jsx'
import QuestionDisplay from '../components/QuestionDisplay.jsx'
import Scoreboard from '../components/Scoreboard.jsx'
import { useGameState } from '../hooks/useGameState.js'

// The projected, student-facing view. It polls /api/game/state and renders the
// turn indicator, active question, race track, and scoreboard. The advance
// animation and winner banner are added in #35.
function GameScreen() {
  const { state, question, loading, error } = useGameState()

  return (
    <main>
      <h1>Space Race</h1>

      {error && <p role="alert">Could not reach the game server.</p>}
      {loading && !state && <p>Loading…</p>}

      {state && state.active === 0 ? (
        <p>Waiting for the teacher to start a game…</p>
      ) : (
        <>
          <TurnIndicator state={state} />
          <QuestionDisplay question={question} />
          <Board state={state} />
          <Scoreboard state={state} />
        </>
      )}
    </main>
  )
}

export default GameScreen
