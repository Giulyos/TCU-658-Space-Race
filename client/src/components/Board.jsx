import { teamColor } from './raceUtils.js'
import { layoutFor, makeWindingPath, sampleAlong } from './boardLayout.js'

// The Jumanji-style board: each team follows a winding path from its start to a
// shared finish, with one board space per step (0..finishLine). A team's ship
// sits on the space matching its score; reaching the finish wins. Start/finish
// positions depend on the team count (see boardLayout). Driven by polled state.
function Board({ state }) {
  if (!state) return null
  const { positions, finishLine, teamNames, currentTeam, winner } = state
  const { finish, starts } = layoutFor(teamNames.length)

  const teams = teamNames.map((name, i) => {
    const team = i + 1
    const start = starts[i] ?? starts[starts.length - 1]
    const path = makeWindingPath(start, finish)
    const spaces = sampleAlong(path, finishLine)
    const pos = Math.min(Math.max(positions[i] ?? 0, 0), finishLine)
    return { team, name, color: teamColor(team), path, spaces, ship: spaces[pos], pos }
  })

  return (
    <div className="board" role="group" aria-label="Race board">
      <svg viewBox="0 0 100 100" className="board-svg" preserveAspectRatio="xMidYMid meet">
        {/* each team's winding path + its board spaces */}
        {teams.map((t) => (
          <g key={t.team}>
            <polyline
              className="board-path"
              points={t.path.map((p) => p.join(',')).join(' ')}
              style={{ stroke: t.color }}
              fill="none"
            />
            {t.spaces.map((s, idx) => (
              <circle key={idx} className="board-space" cx={s[0]} cy={s[1]} r="1.1" />
            ))}
          </g>
        ))}

        {/* shared finish */}
        <circle className="board-finish" cx={finish[0]} cy={finish[1]} r="4" />
        <text
          className="board-finish-flag"
          x={finish[0]}
          y={finish[1]}
          textAnchor="middle"
          dominantBaseline="central"
        >
          🏁
        </text>

        {/* ships on top */}
        {teams.map((t) => {
          const cls = [
            'board-ship',
            currentTeam === t.team && winner == null ? 'is-current' : '',
            winner === t.team ? 'is-winner' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <g key={`ship-${t.team}`} className={cls} data-team={t.team} aria-label={`Team ${t.team} spaceship`}>
              <circle cx={t.ship[0]} cy={t.ship[1]} r="2.8" style={{ fill: t.color }} />
              <text
                className="board-ship-num"
                x={t.ship[0]}
                y={t.ship[1]}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {t.team}
              </text>
            </g>
          )
        })}
      </svg>

      <ul className="board-legend">
        {teams.map((t) => (
          <li key={t.team} style={{ '--team-color': t.color }}>
            <span className="legend-name">{t.name}</span>
            <span className="legend-pos">
              {t.pos}/{finishLine}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Board
