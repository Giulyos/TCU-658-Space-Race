import { useCallback, useEffect, useState } from 'react'
import { getGames, getGameQuestions, deleteGame } from '../api/gamesApi.js'

// The Admin home: a library of saved games. Each game can be played, edited, or
// deleted, and new games can be created. Question counts are fetched per game
// (fine for the handful of games a teacher keeps on a local device).
//
// Props:
//   onPlay(game) — activate and play the game
//   onEdit(game) — open the setup wizard for an existing game
//   onNew()      — open the setup wizard for a new game
function GameLibrary({ onPlay, onEdit, onNew }) {
  const [games, setGames] = useState([])
  const [counts, setCounts] = useState({})
  const [error, setError] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)

  const load = useCallback(async () => {
    try {
      const list = await getGames()
      setGames(list)
      const entries = await Promise.all(
        list.map(async (g) => [g.id, (await getGameQuestions(g.id)).length]),
      )
      setCounts(Object.fromEntries(entries))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleDelete = async (id) => {
    setError(null)
    try {
      await deleteGame(id)
      setConfirmingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="nes-container with-title">
      <p className="title">My Games</p>

      {error && <p role="alert">{error}</p>}

      <button type="button" className="nes-btn is-success" onClick={onNew}>
        + New Game
      </button>

      {games.length === 0 ? (
        <p>No games yet. Create your first game to get started.</p>
      ) : (
        <ul className="nes-list">
          {games.map((game) => (
            <li key={game.id} className="game-row">
              <div className="game-info">
                <strong>{game.name}</strong>
                <span>
                  {game.team_names.length} teams · {counts[game.id] ?? 0} questions
                </span>
              </div>
              <div className="game-actions">
                <button
                  type="button"
                  className="nes-btn is-primary"
                  onClick={() => onPlay(game)}
                >
                  Play
                </button>
                <button
                  type="button"
                  className="nes-btn is-warning"
                  onClick={() => onEdit(game)}
                  aria-label={`Edit ${game.name}`}
                >
                  Edit
                </button>
                {confirmingId === game.id ? (
                  <>
                    <button
                      type="button"
                      className="nes-btn is-error"
                      onClick={() => handleDelete(game.id)}
                      aria-label={`Confirm delete ${game.name}`}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="nes-btn"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="nes-btn is-error"
                    onClick={() => setConfirmingId(game.id)}
                    aria-label={`Delete ${game.name}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GameLibrary
