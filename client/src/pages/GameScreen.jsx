import Board from '../components/Board.jsx'
import TurnIndicator from '../components/TurnIndicator.jsx'
import QuestionDisplay from '../components/QuestionDisplay.jsx'
import GameControls from '../components/GameControls.jsx'
import { useGameState } from '../hooks/useGameState.js'

// The projected, teacher-operated view. It polls /api/game/state and renders the
// turn indicator, the active-question popup, the board (which doubles as the
// scoreboard via each team's position), and the during-game controls. Launch and
// restart live on the Admin panel. The advance animation and winner banner are
// added in #35.
function GameScreen() {
  const { state, question, loading, error, refresh } = useGameState()

  return (
    <main className="game-screen">
      <h1>Space Race</h1>

      {error && <p role="alert">Could not reach the game server.</p>}
      {loading && !state && <p>Loading…</p>}

      {state && state.active === 0 ? (
        <p>Waiting for the teacher to launch a game…</p>
      ) : (
        <>
          <TurnIndicator state={state} />
          <QuestionDisplay question={question} state={state} refresh={refresh} />
          <Board state={state} />
          <GameControls state={state} question={question} refresh={refresh} />
        </>
      )}
    </main>
  )
}

export default GameScreen
