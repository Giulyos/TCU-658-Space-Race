import { teamColor } from './raceUtils.js'

// A team's spaceship, positioned along its lane by a left-offset percentage.
// Colour is per team so students can tell the ships apart at a glance.

function Spaceship({ team, positionPercent }) {
  return (
    <div
      className="spaceship"
      style={{ left: `${positionPercent}%`, '--team-color': teamColor(team) }}
      aria-label={`Team ${team} spaceship`}
    >
      🚀
    </div>
  )
}

export default Spaceship
