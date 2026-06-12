import { useState } from 'react'
import GameLibrary from '../components/GameLibrary.jsx'
import GameWizard from '../components/GameWizard.jsx'
import TurnControls from '../components/TurnControls.jsx'
import { activateGame } from '../api/gamesApi.js'

// The teacher's admin app, organized as a small view router:
//   library — the home: a list of saved games (default)
//   play    — controls for the currently activated game
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

  const handlePlay = async (game) => {
    setError(null)
    try {
      await activateGame(game.id)
      setSelected(game)
      setView('play')
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

      {view === 'play' && (
        <section>
          <h2>Playing: {selected?.name}</h2>
          <button type="button" className="nes-btn" onClick={backToLibrary}>
            Back to games
          </button>
          <TurnControls />
        </section>
      )}

      {view === 'wizard' && <GameWizard game={selected} onCancel={backToLibrary} />}
    </main>
  )
}

export default AdminPanel
