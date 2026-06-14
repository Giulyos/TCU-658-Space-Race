import { teamColor } from './raceUtils.js'

// Shows whose turn it is (or a paused notice). Hidden before a game starts and
// once there is a winner (the winner banner from #35 takes over then).
function TurnIndicator({ state }) {
  if (!state || state.active === 0 || state.winner != null) return null

  const name = state.teamNames[state.currentTeam - 1]
  const paused = state.active === 2

  return (
    <div className="turn-indicator" style={{ '--team-color': teamColor(state.currentTeam) }}>
      {paused ? (
        <span>⏸ Paused</span>
      ) : (
        <span>
          <span className="turn-team">{name}</span>’s turn
        </span>
      )}
    </div>
  )
}

export default TurnIndicator
