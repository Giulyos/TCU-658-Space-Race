import Board from '../components/Board.jsx'
import TurnIndicator from '../components/TurnIndicator.jsx'
import QuestionDisplay from '../components/QuestionDisplay.jsx'
import GameControls from '../components/GameControls.jsx'
import { useGameState } from '../hooks/useGameState.js'
import { useI18n } from '../i18n/context.js'

// The projected, teacher-operated view. It polls /api/game/state and renders the
// turn indicator, the active-question popup, the board (which doubles as the
// scoreboard via each team's position), and the during-game controls. Launch and
// restart live on the Admin panel. The board glides ships to their new space
// after a turn is marked and shows a full-screen winner banner once a team
// reaches the finish.
function GameScreen() {
  const { state, question, loading, error, refresh } = useGameState()
  const { t } = useI18n()

  return (
    <main className="game-screen">
      <h1>Space Race</h1>

      {error && <p role="alert">{t('game.cantReach')}</p>}
      {loading && !state && <p>{t('game.loading')}</p>}

      {state && state.active === 0 ? (
        <p>{t('game.waiting')}</p>
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
