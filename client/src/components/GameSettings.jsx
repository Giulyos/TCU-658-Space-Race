import { useState } from 'react'
import { updateSettings } from '../api/gameApi.js'

// Teacher's game configuration: finish line and the participating teams' names
// (the count of names defines the number of teams). Persists via the settings
// API, which resets the game to a fresh not-started state with the new config.

const MIN_TEAMS = 2
const MAX_TEAMS = 4
const DEFAULT_NAMES = ['Team 1', 'Team 2', 'Team 3', 'Team 4']

function GameSettings() {
  const [finishLine, setFinishLine] = useState(10)
  const [teamCount, setTeamCount] = useState(4)
  const [names, setNames] = useState(DEFAULT_NAMES)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleCountChange = (count) => {
    setTeamCount(count)
    setNames((prev) => {
      const next = prev.slice(0, count)
      while (next.length < count) next.push(`Team ${next.length + 1}`)
      return next
    })
  }

  const handleNameChange = (index, value) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await updateSettings({
        finishLine: Number(finishLine),
        teamNames: names.slice(0, teamCount),
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="nes-container with-title">
      <p className="title">Game Settings</p>

      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Settings saved.</p>}

      <form onSubmit={handleSubmit}>
        <div className="nes-field">
          <label htmlFor="s-finish">Spaces to win</label>
          <input
            id="s-finish"
            type="number"
            min="1"
            className="nes-input"
            value={finishLine}
            onChange={(e) => setFinishLine(e.target.value)}
          />
        </div>

        <div className="nes-field">
          <label htmlFor="s-teams">Number of teams</label>
          <div className="nes-select">
            <select
              id="s-teams"
              value={teamCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
            >
              {Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => MIN_TEAMS + i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {names.slice(0, teamCount).map((name, i) => (
          <div className="nes-field" key={i}>
            <label htmlFor={`s-name-${i}`}>Team {i + 1} name</label>
            <input
              id={`s-name-${i}`}
              className="nes-input"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
            />
          </div>
        ))}

        <button type="submit" className="nes-btn is-primary">
          Save settings
        </button>
      </form>
    </section>
  )
}

export default GameSettings
