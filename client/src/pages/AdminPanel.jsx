import { useState } from 'react'
import GameLibrary from '../components/GameLibrary.jsx'
import GameWizard from '../components/GameWizard.jsx'
import { activateGame } from '../api/gamesApi.js'
import { startGame } from '../api/gameApi.js'
import { navigateTo } from '../lib/nav.js'

// The teacher's admin app, a small view router:
//   library — the home: saved games (default)
//   wizard  — create or edit a game's setup
// Launching a game (Play / Resume / Restart) navigates straight to the projected
// Game Screen — there is no intermediate confirmation screen. The during-game
// controls live on the board.
function AdminPanel() {
  const [view, setView] = useState('library')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  const backToLibrary = () => {
    setSelected(null)
    setError(null)
    setView('library')
  }

  // Open a game on the board. Play and Restart (resume=false) begin a fresh
  // match (activate + start); Resume (resume=true) continues the saved session
  // untouched. Either way, go straight to the Game Screen.
  const handlePlay = async (game, { resume = false } = {}) => {
    setError(null)
    try {
      if (!resume) {
        await activateGame(game.id)
        await startGame()
      }
      navigateTo('/game')
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
      <h1>Admin Panel</h1>
      {error && <p role="alert">{error}</p>}

      {view === 'library' && (
        <GameLibrary onPlay={handlePlay} onEdit={handleEdit} onNew={handleNew} />
      )}

      {view === 'wizard' && (
        <GameWizard game={selected} onDone={backToLibrary} onCancel={backToLibrary} />
      )}
    </main>
  )
}

export default AdminPanel
