import Spaceship from './Spaceship.jsx'
import { teamColor, positionPercent } from './raceUtils.js'

// The race track: one lane per team (the game supports 2-4 teams), each lane a
// row of `finishLine` spaces with the team's ship positioned by its score and a
// finish flag at the end. The lane of the team whose turn it is, and the
// winning lane, are highlighted. Driven entirely by the polled game state.

function RaceTrack({ state }) {
  if (!state) return null
  const { positions, finishLine, teamNames, currentTeam, winner } = state

  return (
    <div className="race-track" role="group" aria-label="Race track">
      {teamNames.map((name, i) => {
        const team = i + 1
        const pos = positions[i] ?? 0
        const classes = [
          'race-lane',
          currentTeam === team && winner == null ? 'is-current' : '',
          winner === team ? 'is-winner' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div key={team} className={classes} data-team={team}>
            <span className="lane-label" style={{ color: teamColor(team) }}>
              {name}
            </span>
            <div
              className="lane-track"
              style={{ '--cells': finishLine }}
              role="img"
              aria-label={`${name}: ${pos} of ${finishLine}`}
            >
              <span className="finish-flag" aria-hidden="true">
                🏁
              </span>
              <Spaceship team={team} positionPercent={positionPercent(pos, finishLine)} />
            </div>
            <span className="lane-pos">
              {pos}/{finishLine}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default RaceTrack
