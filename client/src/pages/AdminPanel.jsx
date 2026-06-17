import { useState } from 'react'
import GameLibrary from '../components/GameLibrary.jsx'
import GameWizard from '../components/GameWizard.jsx'
import { activateGame } from '../api/gamesApi.js'
import { startGame, restartGame } from '../api/gameApi.js'

// The teacher's admin app, organized as a small view router:
//   library — the home: a list of saved games (default)
//   play    — confirmation + Restart for the launched game (the during-game
//             controls live on the projected Game Screen)
//   wizard  — create or edit a game's setup (#48)
function AdminPanel() {
  const [view, setView] = useState('library')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  const backToLibrary = () => {
    setSelected(null)
    setError(null)
    setView('library')
  }

  // Launching a game opens the play view. Play (fresh) activates the game and
  // starts a new match; Resume continues the in-progress save untouched (no
  // activate/start, which would reset positions and the winner).
  const handlePlay = async (game, { resume = false } = {}) => {
    setError(null)
    try {
      if (!resume) {
        await activateGame(game.id)
        await startGame()
      }
      setSelected(game)
      setView('play')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRestart = async () => {
    setError(null)
    try {
      await restartGame()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (game) => {
    setSelected(game)
    setView('wizard')
  }

  const handleNew = () => {
    setSelected(null)
    setView('wizard')
  }

  return (
    <main>
      <a className="screen-nav screen-nav-admin" href="/game">▶ Projector</a>
      <h1>Admin Panel</h1>
      {error && <p role="alert">{error}</p>}

      {view === 'library' && (
        <GameLibrary onPlay={handlePlay} onEdit={handleEdit} onNew={handleNew} />
      )}

      {view === 'play' && (
        <section className="nes-container with-title">
          <p className="title">Now playing: {selected?.name}</p>
          <p>Open the Game Screen to run the game — the Next Question and Correct/Incorrect controls are there.</p>
          <p>
            <a href="/game" target="_blank" rel="noreferrer">
              Open the Game Screen ↗
            </a>
          </p>
          <button type="button" className="nes-btn is-warning" onClick={handleRestart}>
            Restart
          </button>
          <button type="button" className="nes-btn" onClick={backToLibrary}>
            Back to games
          </button>
        </section>
      )}

      {view === 'wizard' && (
        <GameWizard game={selected} onDone={backToLibrary} onCancel={backToLibrary} />
      )}
    </main>
  )
}

export default AdminPanel
