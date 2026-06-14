import { teamColor } from './raceUtils.js'

// A leaderboard of the teams ranked by position (highest first). Hidden before a
// game starts. Driven by the polled game state.
function Scoreboard({ state }) {
  if (!state || state.active === 0) return null

  const ranked = state.teamNames
    .map((name, i) => ({ team: i + 1, name, pos: state.positions[i] ?? 0 }))
    .sort((a, b) => b.pos - a.pos)

  return (
    <section className="scoreboard nes-container with-title">
      <p className="title">Scoreboard</p>
      <ol className="score-list">
        {ranked.map((t, rank) => (
          <li key={t.team} style={{ '--team-color': teamColor(t.team) }}>
            <span className="score-rank">{rank + 1}.</span>
            <span className="score-name">{t.name}</span>
            <span className="score-pos">
              {t.pos}/{state.finishLine}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default Scoreboard
