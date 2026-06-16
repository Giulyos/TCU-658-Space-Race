import { teamColor } from './raceUtils.js'

// Full-screen celebratory banner shown on the projected board when a team
// reaches the finish line. The Board defers it (show=false) until the winning
// ship has finished gliding onto the finish planet, so the win lands *after* the
// movement, not on top of it. Restart lives on the Admin panel, so the banner is
// purely a display — it captures no clicks.
function WinnerBanner({ state, show }) {
  if (!state || state.winner == null || !show) return null

  const team = state.winner
  const name = state.teamNames[team - 1] ?? `Team ${team}`

  return (
    <div
      className="winner-banner"
      role="alert"
      aria-label={`${name} wins`}
      style={{ '--team-color': teamColor(team) }}
    >
      <div className="winner-card nes-container is-dark">
        <p className="winner-stars">★ ★ ★</p>
        <p className="winner-name">{name}</p>
        <p className="winner-sub">WINS!</p>
      </div>
    </div>
  )
}

export default WinnerBanner
