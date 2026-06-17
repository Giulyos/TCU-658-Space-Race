import { useCallback, useEffect, useState } from 'react'
import { getGames, getGameQuestions, deleteGame } from '../api/gamesApi.js'
import { getState } from '../api/gameApi.js'

// The Admin home: a library of saved games. Each game can be played, edited, or
// deleted, and new games can be created. Question counts are fetched per game
// (fine for the handful of games a teacher keeps on a local device).
//
// A game that is the active, in-progress session (started and not yet finished)
// shows "Resume" instead of "Play": Resume continues it untouched, while Play
// starts a fresh match.
//
// Props:
//   onPlay(game, { resume }) — play the game; resume=true continues the save
//   onEdit(game)             — open the setup wizard for an existing game
//   onNew()                  — open the setup wizard for a new game
function GameLibrary({ onPlay, onEdit, onNew }) {
  const [games, setGames] = useState([])
  const [counts, setCounts] = useState({})
  const [progress, setProgress] = useState({ activeGameId: null, active: 0, winner: null })
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
    // Best-effort: which game (if any) is mid-session, so its button can read
    // "Resume". A failure here must not block the library.
    try {
      const { state, activeGameId } = await getState()
      setProgress({ activeGameId, active: state?.active ?? 0, winner: state?.winner ?? null })
    } catch {
      // leave the default (no in-progress game)
    }
  }, [])

  // A game is resumable when it is the loaded game, has been started, and has no
  // winner yet.
  const isResumable = (game) =>
    progress.activeGameId === game.id && progress.active !== 0 && progress.winner == null

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
            <li
              key={game.id}
              className={isResumable(game) ? 'game-row is-current' : 'game-row'}
            >
              <div className="game-info">
                <strong>{game.name}</strong>
                {isResumable(game) && <span className="game-badge">In progress</span>}
                <span>
                  {game.team_names.length} teams · {counts[game.id] ?? 0} questions
                </span>
              </div>
              <div className="game-actions">
                {isResumable(game) ? (
                  <>
                    {/* continue the in-progress save */}
                    <button
                      type="button"
                      className="nes-btn is-primary"
                      onClick={() => onPlay(game, { resume: true })}
                    >
                      Resume
                    </button>
                    {/* start the same game over (fresh match) */}
                    <button
                      type="button"
                      className="nes-btn"
                      onClick={() => onPlay(game, { resume: false })}
                      aria-label={`Restart ${game.name}`}
                    >
                      Restart
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="nes-btn is-primary"
                    onClick={() => onPlay(game, { resume: false })}
                  >
                    Play
                  </button>
                )}
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
